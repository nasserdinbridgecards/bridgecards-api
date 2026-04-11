import { Router } from 'express';
import { log } from '../utils/logger.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { auth, admin } from '../middleware/auth.js';
import { jwtVerify, generateId } from '../utils/crypto.js';
import { dbGetUser, dbSetUser, dbGetOrder, dbGetOrderByPaymentIntent, dbSetOrder, dbAllOrders } from '../db/index.js';
import { productConfigs, isDuplicate } from '../store.js';
import { getLiveFX, FALLBACK_FX } from '../services/fx.js';
import { calcPrice } from '../services/pricing.js';
import {
  getReloadlyToken,
  fetchProduct,
  placeReloadlyOrder,
} from '../services/reloadly.js';
import { getPaymentIntent, stripeRefund } from '../services/stripe.js';
import { sendEmail, emailTemplate, issueInvoice, invoiceHtml, escapeHtml } from '../services/email.js';
import { STRIPE_SECRET } from '../config.js';
import { buildOrderDraft } from '../services/orderFlow.js';

const router = Router();

// ── POST /orders ──────────────────────────────────────────────────────────────
router.post('/', rateLimit(5, 60_000), async (req, res) => {
  const fallbackOrderId = generateId();
  let order = null;
  try {
    // Accept common frontend key variants (productId / product_id / productID, etc.)
    let {
      orderId,
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
    quantity = quantity ?? qty ?? count ?? null;
    // NOTE: frontend-supplied `unitPrice` is IGNORED — server recalculates.

    // Resolve customer identity from JWT.
    let customerEmail = userEmail;
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = jwtVerify(authHeader.slice(7));
      if (payload) { customerEmail = payload.email; userId = payload.userId; }
    }
    if (!customerEmail) return res.status(400).json({ error: 'Authentication required' });

    let paymentIntent = null;

    // Recovery path: read productId / quantity from Stripe PI metadata if not provided.
    if ((!productId || !quantity) && paymentIntentId && STRIPE_SECRET) {
      try {
        paymentIntent = await getPaymentIntent(paymentIntentId);
        if (paymentIntent && !paymentIntent.error) {
          orderId = orderId ?? paymentIntent?.metadata?.order_id ?? null;
          productId = productId ?? paymentIntent?.metadata?.product_id ?? null;
          quantity = quantity ?? paymentIntent?.metadata?.quantity ?? 1;
        }
      } catch (err) {
        log('WARN', 'PI_METADATA_READ_FAILED', { orderId: orderId || fallbackOrderId, paymentIntentId, error: err.message });
      }
    }

    if (!productId || !quantity) return res.status(400).json({ error: 'Missing fields' });

    if (orderId) {
      order = await dbGetOrder(orderId);
    }
    if (!order && paymentIntentId) {
      order = await dbGetOrderByPaymentIntent(paymentIntentId);
    }

    if (order?.status === 'delivered') {
      return res.json({
        ...order,
        orderId: order.id,
        paymentStatus: 'succeeded',
        orderStatus: 'SUCCESSFUL',
        status: 'SUCCESSFUL',
      });
    }
    if (order?.status === 'processing') {
      return res.json({
        ...order,
        orderId: order.id,
        paymentStatus: order.paymentIntentId ? 'succeeded' : 'pending',
        orderStatus: 'PROCESSING',
        status: 'PROCESSING',
      });
    }

    log('INFO', 'ORDER_START', { orderId: order?.id || orderId || fallbackOrderId, productId, quantity, customerEmail });

    if (!order && isDuplicate(customerEmail, productId)) {
      return res.status(429).json({ error: 'Duplicate order — please wait 30 seconds' });
    }

    if (!order) {
      const paymentAmountHint = paymentIntent?.amount ? (paymentIntent.amount / 100) / Number(quantity) : null;
      order = await buildOrderDraft({
        orderId: orderId || fallbackOrderId,
        customerEmail,
        userId,
        productId,
        quantity,
        paymentMethod: paymentMethod || 'unknown',
        paymentIntentId,
        unitPriceHint: req.body.unitPrice ?? paymentIntent?.metadata?.unit_price ?? paymentAmountHint,
      });
    } else {
      order.userId = order.userId || userId;
      order.email = order.email || customerEmail;
      order.paymentMethod = paymentMethod || order.paymentMethod;
      order.paymentIntentId = paymentIntentId || order.paymentIntentId;
      order.updatedAt = new Date().toISOString();
    }

    await dbSetOrder(order.id, order);

    // ── Stripe payment validation ─────────────────────────────────────────────
    if (paymentIntentId && STRIPE_SECRET) {
      if (!paymentIntent) {
        paymentIntent = await getPaymentIntent(paymentIntentId);
      }
      log('INFO', 'PI_STATUS', { id: paymentIntentId, status: paymentIntent.status, amount: paymentIntent.amount });

      if (paymentIntent.status !== 'succeeded') {
        order.status = 'failed';
        order.error = paymentIntent.last_payment_error?.message || 'Payment not confirmed';
        order.updatedAt = new Date().toISOString();
        await dbSetOrder(order.id, order);
        return res.status(402).json({ error: order.error, orderId: order.id });
      }

      // Compare Stripe amount (cents) vs server-calculated amount (allow ±$1 tolerance).
      const expected = Math.round(order.totalAmount * 100);
      const tolerance = 100; // = $1.00
      const diff = paymentIntent.amount - expected;

      if (Math.abs(diff) > tolerance) {
        log('WARN', 'AMOUNT_MISMATCH', { piAmount: paymentIntent.amount, expected, diff, orderId: order.id });
        if (diff < -tolerance) {
          // Underpaid — refund and reject.
          order.status = 'failed';
          order.error = 'Underpayment detected';
          order.updatedAt = new Date().toISOString();
          await dbSetOrder(order.id, order);
          await stripeRefund(paymentIntentId, 'fraudulent');
          return res.status(400).json({ error: 'Payment amount mismatch', orderId: order.id, refunded: true });
        }
        // Overpayment: accept and log (FX rounding edge case).
        log('INFO', 'OVERPAYMENT_ACCEPTED', { extra: diff });
      }
      order.paymentIntentId = paymentIntentId;
      order.status = 'paid';
    } else {
      order.status = 'paid';
    }
    order.updatedAt = new Date().toISOString();
    await dbSetOrder(order.id, order);
    await issueInvoice(order);

    // Confirmation email (fire-and-forget).
    sendEmail({
      to: order.email,
      subject: `✅ Order Confirmed #${order.id} — BridgeCards`,
      html: emailTemplate('✅ Order Received', `
        <div class="r"><span>Order</span><span>${escapeHtml(order.id)}</span></div>
        <div class="r"><span>Product</span><span>${escapeHtml(order.productName)}</span></div>
        <div class="r"><span>Total</span><span>$${order.totalAmount}</span></div>
        <p style="font-size:12px;color:#9294b8;margin-top:10px;">Your code will arrive in seconds.</p>`),
    }).catch(() => { });

    // Non-Reloadly product — manual delivery.
    const numId = parseInt(order.productId, 10);
    if (isNaN(numId)) {
      order.status = 'processing';
      order.updatedAt = new Date().toISOString();
      await dbSetOrder(order.id, order);
      return res.json({ ...order, orderStatus: 'PROCESSING', manualDelivery: true });
    }

    // ── Reloadly fulfillment ──────────────────────────────────────────────────
    order.status = 'processing';
    order.updatedAt = new Date().toISOString();
    await dbSetOrder(order.id, order);

    let rlToken = await getReloadlyToken();

    // Re-fetch denominations to find the exact Reloadly unit price to submit.
    const pd2 = await fetchProduct(numId);
    if (!pd2) throw new Error('Product not found or not active');
    const denoms2 = pd2.fixedSenderDenominations || pd2.fixedRecipientDenominations || [];
    const rates2 = await getLiveFX();
    const cur2 = pd2.fixedSenderCurrencyCode || pd2.senderCurrencyCode || 'USD';
    const r2usd = rates2[cur2] ?? 1;
    const disc2 = pd2.discountPercentage || 0;
    const marginOverride = productConfigs.get(String(numId))?.margin ?? null;
    const countryCode = pd2.countryCode || 'US';

    let bestDenom = denoms2[0];
    let bestDiff = Infinity;
    for (const d of denoms2) {
      const costUSD2 = d * (1 - disc2 / 100) * r2usd;
      const sell2 = calcPrice(costUSD2, marginOverride).sell;
      const gap = Math.abs(sell2 - order.unitPrice);
      if (gap < bestDiff) { bestDiff = gap; bestDenom = d; }
    }

    const rlPayload = {
      productId: numId,
      countryCode,
      quantity: order.quantity,
      unitPrice: bestDenom,
      customIdentifier: orderId,
      senderName: 'BridgeCards',
      recipientEmail: customerEmail,
    };
    log('INFO', 'RL_ORDER', rlPayload);

    const rlData = await placeReloadlyOrder(rlPayload, rlToken);
    log('INFO', 'RL_RESPONSE', { status: rlData.status, error: rlData.errorCode });

    // Failure → auto-refund.
    if (rlData.errorCode || rlData.status === 'FAILED' || (rlData.message && !rlData.transactions)) {
      order.status = 'failed';
      order.error = rlData.message || rlData.errorCode || 'ORDER_FAILED';
      let refundDone = false;
      if (paymentIntentId) {
        const rf = await stripeRefund(paymentIntentId, order.error);
        refundDone = rf?.status === 'succeeded';
        if (refundDone) order.status = 'refunded';
      }
      order.updatedAt = new Date().toISOString();
      await dbSetOrder(order.id, order);
      sendEmail({
        to: order.email,
        subject: `⚠️ Order Failed #${order.id}`,
        html: emailTemplate('⚠️ Order Failed', `
          <p style="color:#ff4f7b">${escapeHtml(order.error)}</p>
          <p style="font-size:12px;color:#9294b8">Refund initiated — 3–5 business days.</p>`, '#ff4f7b'),
      }).catch(() => { });
      return res.status(400).json({
        orderId: order.id,
        paymentStatus: 'succeeded',
        orderStatus: 'FAILED',
        error: 'Card purchase failed',
        refunded: refundDone,
        refundMessage: refundDone
          ? '✅ Refund initiated — 3–5 business days'
          : '⚠️ Contact support@bridgecards.org',
      });
    }

    // ── Success ───────────────────────────────────────────────────────────────
    order.status = 'delivered';
    order.reloadlyOrderId = rlData.transactionId || rlData.id;
    order.updatedAt = new Date().toISOString();

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
    const user = await dbGetUser(order.email);
    if (user) {
      user.orderCount = (user.orderCount || 0) + 1;
      user.totalSpent = parseFloat(((user.totalSpent || 0) + order.totalAmount).toFixed(2));
      await dbSetUser(order.email, user);
    }
    log('INFO', 'DELIVERED', { orderId: order.id, codes: order.codes.length });

    if (order.codes.length) {
      const codesHtml = order.codes.map((c) => `<div class="cb">${escapeHtml(c)}</div>`).join('');
      sendEmail({
        to: order.email,
        subject: `🎉 Your code is ready — #${order.id}`,
        html: emailTemplate('🎉 Code Delivered!', `
          <p>Your <strong>${escapeHtml(order.productName)}</strong>:</p>${codesHtml}
          <p style="font-size:11px;color:#9294b8;margin-top:8px">
            Any issues within 48 h — contact us.
          </p>`, '#00d4aa'),
      }).catch(() => { });
    }

    return res.json({
      ...rlData,
      orderId: order.id,
      invoiceNo: order.invoiceNo,
      paymentStatus: 'succeeded',
      orderStatus: 'SUCCESSFUL',
      status: 'SUCCESSFUL',
    });

  } catch (err) {
    const failedOrderId = order?.id || fallbackOrderId;
    log('ERROR', 'ORDER_ERR', { orderId: failedOrderId, error: err.message });
    if (order) {
      order.status = 'failed';
      order.error = err.message;
      order.updatedAt = new Date().toISOString();
      await dbSetOrder(order.id, order);
    }
    if (order?.paymentIntentId || req.body.paymentIntentId) {
      await stripeRefund(order?.paymentIntentId || req.body.paymentIntentId, 'server_error');
    }
    if (err.message === 'TIMEOUT') {
      return res.status(503).json({ error: 'Service unavailable', orderId: failedOrderId, refunded: true });
    }
    return res.status(500).json({ error: err.message, orderId: failedOrderId });
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
  const list = await dbAllOrders(status ? { status } : {});
  const total = list.length;
  const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  return res.json({
    total,
    page: parseInt(page, 10),
    orders: list.slice(start, start + parseInt(limit, 10)),
  });
});

// ── PATCH /orders/:id ─────────────────────────────────────────────────────────
router.patch('/:id', admin, async (req, res) => {
  const order = await dbGetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const ALLOWED_STATUSES = ['pending_payment', 'pending', 'paid', 'processing', 'delivered', 'failed', 'refunded'];
  if (req.body.status && !ALLOWED_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (req.body.status) order.status = req.body.status;
  if (req.body.notes) order.adminNotes = req.body.notes;
  order.updatedAt = new Date().toISOString();
  await dbSetOrder(req.params.id, order);
  return res.json(order);
});

export default router;
