import { Router }         from 'express';
import { log }             from '../utils/logger.js';
import { rateLimit }       from '../middleware/rateLimit.js';
import { auth, admin }     from '../middleware/auth.js';
import { jwtVerify, generateId } from '../utils/crypto.js';
import { dbGetUser, dbSetUser, dbGetOrder, dbSetOrder, dbAllOrders } from '../db/index.js';
import { settings, productConfigs, isDuplicate } from '../store.js';
import { getLiveFX, FALLBACK_FX } from '../services/fx.js';
import { calcPrice } from '../services/pricing.js';
import {
  getReloadlyToken,
  fetchProduct,
  placeReloadlyOrder,
} from '../services/reloadly.js';
import { getPaymentIntent, stripeRefund } from '../services/stripe.js';
import { sendEmail, emailTemplate, issueInvoice, invoiceHtml, escapeHtml } from '../services/email.js';
import { STRIPE_SECRET, RL_BASE } from '../config.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const router = Router();

// ── POST /orders ──────────────────────────────────────────────────────────────
router.post('/', rateLimit(5, 60_000), async (req, res) => {
  const orderId = generateId();
  let order     = null;
  try {
    // Accept common frontend key variants (productId / product_id / productID, etc.)
    let {
      productId,
      product_id,
      productID,
      quantity,
      qty,
      count,
      paymentMethod,
      paymentIntentId,
      userEmail,
    } = req.body;

    productId = productId ?? product_id ?? productID ?? null;
    quantity  = quantity  ?? qty ?? count ?? null;
    // NOTE: frontend-supplied `unitPrice` is IGNORED — server recalculates.

    // Resolve customer identity from JWT.
    let customerEmail = userEmail;
    let userId        = null;
    const authHeader  = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = jwtVerify(authHeader.slice(7));
      if (payload) { customerEmail = payload.email; userId = payload.userId; }
    }
    if (!customerEmail) return res.status(400).json({ error: 'Authentication required' });

    // Recovery path: read productId / quantity from Stripe PI metadata if not provided.
    if ((!productId || !quantity) && paymentIntentId && STRIPE_SECRET) {
      try {
        const pi = await getPaymentIntent(paymentIntentId);
        if (pi && !pi.error) {
          productId = productId ?? pi?.metadata?.product_id ?? null;
          quantity  = quantity  ?? pi?.metadata?.quantity   ?? 1;
        }
      } catch (err) {
        log('WARN', 'PI_METADATA_READ_FAILED', { orderId, paymentIntentId, error: err.message });
      }
    }

    if (!productId || !quantity) return res.status(400).json({ error: 'Missing fields' });

    log('INFO', 'ORDER_START', { orderId, productId, quantity, customerEmail });

    if (isDuplicate(customerEmail, productId)) {
      return res.status(429).json({ error: 'Duplicate order — please wait 30 seconds' });
    }

    // ── Server-side price calculation ─────────────────────────────────────────
    const numId = parseInt(productId, 10);
    let serverUnitPrice = null;
    let countryCode     = 'US';
    let productName     = String(productId);
    let rlToken         = null;

    if (!isNaN(numId)) {
      try {
        rlToken = await getReloadlyToken();
        const pd = await fetchProduct(numId);
        if (!pd) throw new Error('Product not found or not active');

        productName = pd.productName || String(productId);
        countryCode = pd.countryCode || 'US';

        const currency  = pd.fixedSenderCurrencyCode || pd.senderCurrencyCode || 'USD';
        const discount  = pd.discountPercentage || 0;
        const denoms    = pd.fixedSenderDenominations || pd.fixedRecipientDenominations || [];
        const rates     = await getLiveFX();
        const rateToUSD = rates[currency] ?? FALLBACK_FX[currency] ?? 1;
        const margin    = productConfigs.get(String(numId))?.margin ?? null;

        // Match the denomination hint from the frontend against the Reloadly list.
        const frontendDenom = parseFloat(req.body.unitPrice || 0);
        const matched = (frontendDenom > 0
          ? denoms.find((d) => Math.abs(d - frontendDenom) < frontendDenom * 0.1)
          : null) ?? denoms[0];
        if (!matched) throw new Error('No valid denomination found');

        const costUSD = matched * (1 - discount / 100) * rateToUSD;
        const pricing = calcPrice(costUSD, margin);
        serverUnitPrice = pricing.sell;

        log('INFO', 'SERVER_PRICE_TRUSTED', {
          orderId,
          product:  productName,
          denom:    matched,
          currency,
          costUSD:  pricing.cost.toFixed(2),
          sell:     serverUnitPrice,
          profit:   pricing.profit,
        });
      } catch (err) {
        if (err.message === 'TIMEOUT') {
          return res.status(503).json({
            error:          'Service unavailable',
            orderId,
            refundMessage:  'Please try again — no charge was made',
          });
        }
        log('WARN', 'PRICE_CALC_WARN', { error: err.message });
        return res.status(503).json({
          error:   'Live supplier pricing unavailable. Please retry in a moment.',
          orderId,
        });
      }
    } else {
      // Non-Reloadly (manual / crypto) — use frontend price but enforce positive.
      serverUnitPrice = parseFloat(req.body.unitPrice || 0);
      if (serverUnitPrice <= 0) return res.status(400).json({ error: 'Invalid price' });
    }

    const totalAmount = parseFloat((serverUnitPrice * parseInt(quantity, 10)).toFixed(2));

    order = {
      id:              orderId,
      userId,
      email:           customerEmail,
      productId,
      productName,
      quantity:        parseInt(quantity, 10),
      unitPrice:       serverUnitPrice,
      totalAmount,
      paymentMethod:   paymentMethod || 'unknown',
      paymentIntentId: paymentIntentId || null,
      status:          'pending',
      codes:           [],
      reloadlyOrderId: null,
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
      error:           null,
    };
    await dbSetOrder(orderId, order);

    // ── Stripe payment validation ─────────────────────────────────────────────
    if (paymentIntentId && STRIPE_SECRET) {
      const pi = await getPaymentIntent(paymentIntentId);
      log('INFO', 'PI_STATUS', { id: paymentIntentId, status: pi.status, amount: pi.amount });

      if (pi.status !== 'succeeded') {
        order.status = 'failed';
        order.error  = 'Payment not confirmed';
        await dbSetOrder(orderId, order);
        return res.status(402).json({ error: order.error, orderId });
      }

      // Compare Stripe amount (cents) vs server-calculated amount (allow ±$1 tolerance).
      const expected  = Math.round(totalAmount * 100);
      const tolerance = 100; // = $1.00
      const diff      = pi.amount - expected;

      if (Math.abs(diff) > tolerance) {
        log('WARN', 'AMOUNT_MISMATCH', { piAmount: pi.amount, expected, diff, orderId });
        if (diff < -tolerance) {
          // Underpaid — refund and reject.
          order.status = 'failed';
          order.error  = 'Underpayment detected';
          await dbSetOrder(orderId, order);
          await stripeRefund(paymentIntentId, 'fraudulent');
          return res.status(400).json({ error: 'Payment amount mismatch', orderId, refunded: true });
        }
        // Overpayment: accept and log (FX rounding edge case).
        log('INFO', 'OVERPAYMENT_ACCEPTED', { extra: diff });
      }
      order.status = 'paid';
    } else {
      order.status = 'paid';
    }
    await dbSetOrder(orderId, order);
    await issueInvoice(order);

    // Confirmation email (fire-and-forget).
    sendEmail({
      to:      customerEmail,
      subject: `✅ Order Confirmed #${orderId} — BridgeCards`,
      html:    emailTemplate('✅ Order Received', `
        <div class="r"><span>Order</span><span>${escapeHtml(orderId)}</span></div>
        <div class="r"><span>Product</span><span>${escapeHtml(productName)}</span></div>
        <div class="r"><span>Total</span><span>$${totalAmount}</span></div>
        <p style="font-size:12px;color:#9294b8;margin-top:10px;">Your code will arrive in seconds.</p>`),
    }).catch(() => {});

    // Non-Reloadly product — manual delivery.
    if (isNaN(numId)) {
      order.status = 'processing';
      await dbSetOrder(orderId, order);
      return res.json({ ...order, orderStatus: 'PROCESSING', manualDelivery: true });
    }

    // ── Reloadly fulfillment ──────────────────────────────────────────────────
    order.status = 'processing';
    await dbSetOrder(orderId, order);

    // Re-fetch denominations to find the exact Reloadly unit price to submit.
    const pd2    = await fetchProduct(numId);
    const denoms2 = pd2.fixedSenderDenominations || pd2.fixedRecipientDenominations || [];
    const rates2  = await getLiveFX();
    const cur2    = pd2.fixedSenderCurrencyCode || pd2.senderCurrencyCode || 'USD';
    const r2usd   = rates2[cur2] ?? 1;
    const disc2   = pd2.discountPercentage || 0;

    let bestDenom = denoms2[0];
    let bestDiff  = Infinity;
    for (const d of denoms2) {
      const costUSD2 = d * (1 - disc2 / 100) * r2usd;
      const sell2    = calcPrice(costUSD2).sell;
      const gap      = Math.abs(sell2 - serverUnitPrice);
      if (gap < bestDiff) { bestDiff = gap; bestDenom = d; }
    }

    const rlPayload = {
      productId:        numId,
      countryCode,
      quantity:         order.quantity,
      unitPrice:        bestDenom,
      customIdentifier: orderId,
      senderName:       'BridgeCards',
      recipientEmail:   customerEmail,
    };
    log('INFO', 'RL_ORDER', rlPayload);

    const rlData = await placeReloadlyOrder(rlPayload, rlToken);
    log('INFO', 'RL_RESPONSE', { status: rlData.status, error: rlData.errorCode });

    // Failure → auto-refund.
    if (rlData.errorCode || rlData.status === 'FAILED' || (rlData.message && !rlData.transactions)) {
      order.status = 'failed';
      order.error  = rlData.message || rlData.errorCode || 'ORDER_FAILED';
      let refundDone = false;
      if (paymentIntentId) {
        const rf = await stripeRefund(paymentIntentId, order.error);
        refundDone = rf?.status === 'succeeded';
        if (refundDone) order.status = 'refunded';
      }
      await dbSetOrder(orderId, order);
      sendEmail({
        to:      customerEmail,
        subject: `⚠️ Order Failed #${orderId}`,
        html:    emailTemplate('⚠️ Order Failed', `
          <p style="color:#ff4f7b">${escapeHtml(order.error)}</p>
          <p style="font-size:12px;color:#9294b8">Refund initiated — 3–5 business days.</p>`, '#ff4f7b'),
      }).catch(() => {});
      return res.status(400).json({
        orderId,
        paymentStatus: 'succeeded',
        orderStatus:   'FAILED',
        error:         'Card purchase failed',
        refunded:      refundDone,
        refundMessage: refundDone
          ? '✅ Refund initiated — 3–5 business days'
          : '⚠️ Contact support@bridgecards.org',
      });
    }

    // ── Success ───────────────────────────────────────────────────────────────
    order.status          = 'delivered';
    order.reloadlyOrderId = rlData.transactionId || rlData.id;
    order.updatedAt       = new Date().toISOString();

    const transactions = rlData.transactions || rlData.cards || [rlData];
    order.codes = transactions
      .map((t) =>
        t.pinCode ||
        t.cardNumber ||
        t.code ||
        (t.cards?.[0] && (t.cards[0].pinCode || t.cards[0].cardNumber)) ||
        '',
      )
      .filter(Boolean);

    await dbSetOrder(orderId, order);

    // Update user statistics.
    const user = await dbGetUser(customerEmail);
    if (user) {
      user.orderCount = (user.orderCount || 0) + 1;
      user.totalSpent = parseFloat(((user.totalSpent || 0) + totalAmount).toFixed(2));
      await dbSetUser(customerEmail, user);
    }
    log('INFO', 'DELIVERED', { orderId, codes: order.codes.length });

    if (order.codes.length) {
      const codesHtml = order.codes.map((c) => `<div class="cb">${escapeHtml(c)}</div>`).join('');
      sendEmail({
        to:      customerEmail,
        subject: `🎉 Your code is ready — #${orderId}`,
        html:    emailTemplate('🎉 Code Delivered!', `
          <p>Your <strong>${escapeHtml(productName)}</strong>:</p>${codesHtml}
          <p style="font-size:11px;color:#9294b8;margin-top:8px">
            Any issues within 48 h — contact us.
          </p>`, '#00d4aa'),
      }).catch(() => {});
    }

    return res.json({
      ...rlData,
      orderId,
      invoiceNo:     order.invoiceNo,
      paymentStatus: 'succeeded',
      orderStatus:   'SUCCESSFUL',
      status:        'SUCCESSFUL',
    });

  } catch (err) {
    log('ERROR', 'ORDER_ERR', { orderId, error: err.message });
    if (order) {
      order.status = 'failed';
      order.error  = err.message;
      await dbSetOrder(orderId, order);
    }
    if (req.body.paymentIntentId) {
      await stripeRefund(req.body.paymentIntentId, 'server_error');
    }
    if (err.message === 'TIMEOUT') {
      return res.status(503).json({ error: 'Service unavailable', orderId, refunded: true });
    }
    return res.status(500).json({ error: err.message, orderId });
  }
});

// ── GET /orders/user ──────────────────────────────────────────────────────────
router.get('/user', auth, async (req, res) => {
  const list = await dbAllOrders({ email: req.user.email, userId: req.user.userId });
  return res.json(list.map(({ codes, ...order }) => ({ ...order, hasCodes: codes?.length > 0 })));
});

// ── GET /orders/user/:id ──────────────────────────────────────────────────────
router.get('/user/:id', auth, async (req, res) => {
  const order = await dbGetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.userId !== req.user.userId && order.email !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(order);
});

// ── GET /orders/user/:id/invoice ──────────────────────────────────────────────
router.get('/user/:id/invoice', auth, async (req, res) => {
  const order = await dbGetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.userId !== req.user.userId && order.email !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!order.invoiceNo) return res.status(404).json({ error: 'Invoice not generated yet' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(invoiceHtml(order));
});

// ── GET /orders/admin ─────────────────────────────────────────────────────────
router.get('/admin', admin, async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const list  = await dbAllOrders(status ? { status } : {});
  const total = list.length;
  const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  return res.json({
    total,
    page:   parseInt(page, 10),
    orders: list.slice(start, start + parseInt(limit, 10)),
  });
});

// ── PATCH /orders/:id ─────────────────────────────────────────────────────────
router.patch('/:id', admin, async (req, res) => {
  const order = await dbGetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const ALLOWED_STATUSES = ['pending', 'paid', 'processing', 'delivered', 'failed', 'refunded'];
  if (req.body.status && !ALLOWED_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (req.body.status) order.status     = req.body.status;
  if (req.body.notes)  order.adminNotes = req.body.notes;
  order.updatedAt = new Date().toISOString();
  await dbSetOrder(req.params.id, order);
  return res.json(order);
});

export default router;
