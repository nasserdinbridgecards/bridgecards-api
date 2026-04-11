import { Router } from 'express';
import crypto from 'crypto';
import { STRIPE_PUB, STRIPE_WEBHOOK, STRIPE_SECRET, SANDBOX, ADMIN_EMAIL, RL_BASE } from '../config.js';
import { log } from '../utils/logger.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { settings, productConfigs } from '../store.js';
import { getLiveFX, getFxCacheInfo } from '../services/fx.js';
import { getServerPrice, fetchProduct, getReloadlyToken } from '../services/reloadly.js';
import { calcPrice } from '../services/pricing.js';
import { createPaymentIntent } from '../services/stripe.js';
import { sendEmail, emailTemplate, escapeHtml, issueInvoice } from '../services/email.js';
import { buildOrderDraft } from '../services/orderFlow.js';
import { getDbHandle, dbGetOrder, dbGetOrderByPaymentIntent, dbSetOrder } from '../db/index.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const router = Router();

// GET /api/health
router.get('/health', (req, res) => {
  const db = getDbHandle();
  res.json({
    status: 'ok',
    sandbox: SANDBOX,
    version: '3.1.0',
    db: db?.isMongoose ? 'mongodb' : 'unavailable',
  });
});

// GET /api/stripe-key
router.get('/stripe-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUB });
});

// GET /api/fx-rates
router.get('/fx-rates', async (req, res) => {
  const rates = await getLiveFX();
  const { updatedAt } = getFxCacheInfo();
  res.json({ rates, updatedAt: new Date(updatedAt).toISOString() });
});

// GET /api/settings  (public subset)
router.get('/settings', (req, res) => {
  res.json({
    allowedPayments: settings.allowedPayments,
    maintenanceMode: settings.maintenanceMode,
  });
});

// GET /api/availability
router.get('/availability', (req, res) => {
  const out = {};
  for (const [id, cfg] of productConfigs) {
    if (cfg.availability) out[id] = cfg.availability;
  }
  res.json(out);
});

// POST /api/price  — server-side trusted pricing
router.post('/price', rateLimit(20, 60_000), async (req, res) => {
  const { productId, denomination } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });

  const numId = parseInt(productId, 10);

  // Non-Reloadly product: calculate from the supplied denomination directly.
  if (isNaN(numId)) {
    if (!denomination) return res.status(400).json({ error: 'denomination required' });
    return res.json({ ...calcPrice(parseFloat(denomination)), trusted: true });
  }

  const data = await getServerPrice(numId, denomination ? parseFloat(denomination) : null);
  if (!data) return res.status(404).json({ error: 'Product not found or inactive' });
  return res.json({ ...data, trusted: true });
});

// GET /api/products
router.get('/products', async (req, res) => {
  try {
    const token = await getReloadlyToken();
    const r = await fetchWithTimeout(`${RL_BASE}/products?size=200`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    const data = await r.json();
    let products = data.content || data;

    if (productConfigs.size > 0) {
      products = products.filter(
        (p) => productConfigs.get(String(p.productId))?.enabled !== false,
      );
    }
    return res.json({ content: products, totalElements: products.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/check-product
router.post('/check-product', rateLimit(5, 60_000), async (req, res) => {
  try {
    const numId = parseInt(req.body.productId, 10);
    if (isNaN(numId)) return res.json({ available: false, error: 'Product unavailable' });

    const pd = await fetchProduct(numId);
    if (!pd) return res.json({ available: false, error: 'Product unavailable' });
    if (pd.quantity != null && pd.quantity <= 0) {
      return res.json({ available: false, error: 'Out of stock' });
    }
    return res.json({ available: true });
  } catch (err) {
    if (err.message === 'TIMEOUT') return res.json({ available: false, error: 'Service unavailable' });
    return res.json({ available: true });
  }
});

// POST /api/create-payment-intent
router.post('/create-payment-intent', rateLimit(5, 60_000), async (req, res) => {
  try {
    const { amount, currency, email, productId, quantity, paymentMethod, unitPrice } = req.body;
    if (!email || !productId || !quantity) {
      return res.status(400).json({ error: 'email, productId, and quantity are required' });
    }

    const unitPriceHint = unitPrice ?? ((amount && quantity) ? Number(amount) / Number(quantity) : null);
    const order = await buildOrderDraft({
      customerEmail: email.toLowerCase().trim(),
      productId,
      quantity,
      paymentMethod: paymentMethod || 'card',
      unitPriceHint,
    });

    await dbSetOrder(order.id, order);

    try {
      const result = await createPaymentIntent({
        amount: order.totalAmount,
        currency,
        email: order.email,
        productId: order.productId,
        quantity: order.quantity,
        metadata: {
          order_id: order.id,
          unit_price: order.unitPrice,
        },
      });

      order.paymentIntentId = result.id;
      order.updatedAt = new Date().toISOString();
      await dbSetOrder(order.id, order);

      return res.json({
        ...result,
        orderId: order.id,
        amount: order.totalAmount,
      });
    } catch (err) {
      order.status = 'failed';
      order.error = `Payment intent creation failed: ${err.message}`;
      order.updatedAt = new Date().toISOString();
      await dbSetOrder(order.id, order);
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

async function getOrderForPaymentIntent(paymentIntent) {
  const orderId = paymentIntent?.metadata?.order_id;
  if (orderId) {
    const order = await dbGetOrder(orderId);
    if (order) return order;
  }
  return dbGetOrderByPaymentIntent(paymentIntent.id);
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  const order = await getOrderForPaymentIntent(paymentIntent);
  if (!order) {
    log('WARN', 'WEBHOOK_ORDER_NOT_FOUND', { paymentIntentId: paymentIntent.id, event: 'payment_intent.succeeded' });
    return;
  }
  if (['delivered', 'processing', 'paid'].includes(order.status)) return;

  order.paymentIntentId = paymentIntent.id;
  order.status = 'paid';
  order.error = null;
  order.updatedAt = new Date().toISOString();
  await dbSetOrder(order.id, order);
  await issueInvoice(order);
  log('INFO', 'WEBHOOK_PAYMENT_SUCCEEDED', { orderId: order.id, paymentIntentId: paymentIntent.id });
}

async function handlePaymentIntentFailed(paymentIntent) {
  const order = await getOrderForPaymentIntent(paymentIntent);
  if (!order) {
    log('WARN', 'WEBHOOK_ORDER_NOT_FOUND', { paymentIntentId: paymentIntent.id, event: 'payment_intent.payment_failed' });
    return;
  }

  order.paymentIntentId = paymentIntent.id;
  order.status = 'failed';
  order.error = paymentIntent.last_payment_error?.message || 'Payment failed';
  order.updatedAt = new Date().toISOString();
  await dbSetOrder(order.id, order);
  log('WARN', 'WEBHOOK_PAYMENT_FAILED', {
    orderId: order.id,
    paymentIntentId: paymentIntent.id,
    error: order.error,
  });
}

// POST /api/stripe-webhook
router.post('/stripe-webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const ts = sig.match(/t=(\d+)/)?.[1] || '0';
    const v1 = sig.match(/v1=([a-f0-9]+)/)?.[1] || '';
    const expected = crypto
      .createHmac('sha256', STRIPE_WEBHOOK)
      .update(`${ts}.${req.body}`)
      .digest('hex');

    if (v1 !== expected) {
      log('WARN', 'WEBHOOK_SIG_INVALID');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentIntentSucceeded(event.data.object);
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentIntentFailed(event.data.object);
    } else if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object;
      log('WARN', 'CHARGEBACK', {
        charge: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
      });
      const adminEmail = ADMIN_EMAIL;
      sendEmail({
        to: adminEmail,
        subject: `⚠️ CHARGEBACK: ${dispute.charge}`,
        html: emailTemplate('⚠️ Chargeback', `
          <div class="r"><span>Charge</span><span>${escapeHtml(dispute.charge)}</span></div>
          <div class="r"><span>Amount</span><span>$${(dispute.amount / 100).toFixed(2)}</span></div>
          <div class="r"><span>Reason</span><span>${escapeHtml(dispute.reason)}</span></div>`, '#ff4f7b'),
      }).catch(() => { });
    }
    return res.json({ received: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
