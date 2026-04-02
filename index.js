import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const RELOADLY_ID     = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const SANDBOX         = process.env.RELOADLY_SANDBOX === 'true';
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUB      = process.env.STRIPE_PUBLISHABLE_KEY;

const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';

// === LOGGING ===
function log(level, action, data = {}) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, level, action, ...data }));
}

// === RATE LIMITER ===
const rateLimitMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  requests.push(now);
  rateLimitMap.set(ip, requests);
  if (requests.length > maxRequests) {
    log('WARN', 'RATE_LIMIT', { ip });
    return res.status(429).json({ error: 'طلبات كثيرة جداً، يرجى الانتظار دقيقة.' });
  }
  next();
}

// === DOUBLE ORDER PROTECTION ===
const recentOrders = new Map();
function checkDuplicate(email, productId) {
  const key = `${email}:${productId}`;
  const now = Date.now();
  const last = recentOrders.get(key);
  if (last && now - last < 30000) return true; // 30 ثانية
  recentOrders.set(key, now);
  return false;
}

// === FETCH WITH TIMEOUT ===
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('TIMEOUT');
    throw e;
  }
}

// === RELOADLY TOKEN ===
async function getToken() {
  const res = await fetchWithTimeout('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: RELOADLY_ID,
      client_secret: RELOADLY_SECRET,
      grant_type: 'client_credentials',
      audience: SANDBOX
        ? 'https://giftcards-sandbox.reloadly.com'
        : 'https://giftcards.reloadly.com',
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error('Reloadly auth failed: ' + JSON.stringify(d));
  return d.access_token;
}

// === STRIPE REFUND ===
async function refundStripe(paymentIntentId, reason) {
  try {
    log('INFO', 'REFUND_INITIATED', { paymentIntentId, reason });
    const body = new URLSearchParams({ payment_intent: paymentIntentId, reason: 'other' });
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const refund = await res.json();
    log('INFO', 'REFUND_RESULT', { status: refund.status, id: refund.id });
    return refund;
  } catch (e) {
    log('ERROR', 'REFUND_FAILED', { error: e.message });
    return null;
  }
}

// === HEALTH ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sandbox: SANDBOX });
});

// === STRIPE KEY ===
app.get('/api/stripe-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUB });
});

// === CHECK PRODUCT ===
app.post('/api/check-product', rateLimit, async (req, res) => {
  try {
    const { productId } = req.body;
    const numericId = parseInt(productId);
    log('INFO', 'CHECK_PRODUCT', { productId: numericId });
    if (isNaN(numericId)) {
      return res.json({ available: false, error: 'الكرت غير متوفر حالياً' });
    }
    const token = await getToken();
    const productRes = await fetchWithTimeout(`${RL_BASE}/products/${numericId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    const pd = await productRes.json();
    log('INFO', 'PRODUCT_STATUS', { name: pd.productName, status: pd.status, qty: pd.quantity });
    if (pd.status !== 'ACTIVE') {
      return res.json({ available: false, error: 'الكرت غير متوفر حالياً' });
    }
    if (pd.quantity !== undefined && pd.quantity !== null && pd.quantity <= 0) {
      return res.json({ available: false, error: 'الكرت نفد من المخزون' });
    }
    res.json({ available: true });
  } catch (e) {
    if (e.message === 'TIMEOUT') {
      log('ERROR', 'CHECK_PRODUCT_TIMEOUT', { productId: req.body.productId });
      return res.json({ available: false, error: 'الخدمة غير متاحة حالياً' });
    }
    log('ERROR', 'CHECK_PRODUCT_ERROR', { error: e.message });
    res.json({ available: true });
  }
});

// === CREATE PAYMENT INTENT ===
app.post('/api/create-payment-intent', rateLimit, async (req, res) => {
  try {
    const { amount, currency = 'usd', email, productId } = req.body;
    log('INFO', 'CREATE_PAYMENT_INTENT', { amount, currency, email, productId });
    if (!amount) return res.status(400).json({ error: 'amount required' });

    // منع البيع بخسارة
    if (!SANDBOX && productId) {
      try {
        const token = await getToken();
        const productRes = await fetchWithTimeout(`${RL_BASE}/products/${parseInt(productId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/com.reloadly.giftcards-v1+json',
          },
        });
        const pd = await productRes.json();
        const reloadlyCost = pd.fixedRecipientDenominations?.[0] || pd.fixedSenderDenominations?.[0];
        if (reloadlyCost) {
          const stripeFee = (amount * 0.029) + 0.30;
          const totalCost = reloadlyCost + stripeFee;
          log('INFO', 'PROFIT_CHECK', { sellPrice: amount, reloadlyCost, stripeFee: stripeFee.toFixed(2), totalCost: totalCost.toFixed(2) });
          if (amount <= totalCost) {
            log('WARN', 'LOSS_PREVENTED', { sellPrice: amount, totalCost });
            return res.status(400).json({ error: 'السعر غير متاح حالياً، يرجى المحاولة لاحقاً' });
          }
        }
      } catch (e) {
        log('WARN', 'PROFIT_CHECK_FAILED', { error: e.message });
      }
    }

    // تحقق من رصيد Reloadly
    try {
      const token = await getToken();
      const balRes = await fetchWithTimeout(`${RL_BASE}/accounts/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
        },
      });
      const bal = await balRes.json();
      const balance = bal.balance || bal.currencyBalance || 0;
      log('INFO', 'RELOADLY_BALANCE', { balance });
      if (!SANDBOX && balance < amount * 1.1) {
        return res.status(503).json({ error: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.' });
      }
    } catch (e) {
      log('WARN', 'BALANCE_CHECK_FAILED', { error: e.message });
    }

    const body = new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency,
      'payment_method_types[]': 'card',
      'metadata[customer_email]': email || '',
      'metadata[product_id]': productId || '',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const pi = await response.json();
    if (pi.error) throw new Error(pi.error.message);
    log('INFO', 'PAYMENT_INTENT_CREATED', { id: pi.id, amount });
    res.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (e) {
    log('ERROR', 'CREATE_PAYMENT_INTENT_ERROR', { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// === ORDER ===
app.post('/api/order', rateLimit, async (req, res) => {
  try {
    const { productId, quantity, unitPrice, recipientEmail, paymentIntentId } = req.body;
    log('INFO', 'ORDER_REQUEST', { productId, quantity, unitPrice, recipientEmail });

    // منع الطلبات المكررة
    if (recipientEmail && productId && checkDuplicate(recipientEmail, productId)) {
      log('WARN', 'DUPLICATE_ORDER', { recipientEmail, productId });
      return res.status(429).json({ error: 'طلب مكرر، يرجى الانتظار 30 ثانية' });
    }

    const numericProductId = parseInt(productId);
    if (isNaN(numericProductId)) {
      if (paymentIntentId) await refundStripe(paymentIntentId, 'product_not_available');
      return res.status(400).json({
        error: 'المنتج غير متوفر في Reloadly حالياً.',
        refunded: !!paymentIntentId,
        refundMessage: paymentIntentId ? '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك' : '',
      });
    }

    if (!quantity || !unitPrice || !recipientEmail) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // تحقق من Stripe
    if (paymentIntentId) {
      const piRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
      );
      const pi = await piRes.json();
      log('INFO', 'PAYMENT_INTENT_STATUS', { id: paymentIntentId, status: pi.status });

      // التحقق من مبلغ الدفع
      const expectedAmount = Math.round(parseFloat(unitPrice) * parseInt(quantity) * 100);
      if (pi.amount && Math.abs(pi.amount - expectedAmount) > 50) {
        log('WARN', 'AMOUNT_MISMATCH', { piAmount: pi.amount, expectedAmount });
        return res.status(400).json({ error: 'مبلغ الدفع غير متطابق' });
      }

      if (pi.status !== 'succeeded') {
        return res.status(402).json({ error: 'لم يتم تأكيد الدفع' });
      }
    }

    const token = await getToken();
    let finalUnitPrice = parseFloat(unitPrice);
    let countryCode = 'US';

    try {
      const productRes = await fetchWithTimeout(`${RL_BASE}/products/${numericProductId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
        },
      });
      const pd = await productRes.json();
      log('INFO', 'PRODUCT_DATA', { name: pd.productName, country: pd.countryCode });

      if (pd.countryCode) countryCode = pd.countryCode;
      else if (pd.country?.isoName) countryCode = pd.country.isoName;

      // السعر يُحسب من Reloadly فقط - تجاهل سعر frontend
      const requested = parseFloat(unitPrice);
      if (pd.fixedRecipientDenominations?.length) {
        const match = pd.fixedRecipientDenominations.find(d => Math.abs(d - requested) < 3);
        finalUnitPrice = match !== undefined ? match : pd.fixedRecipientDenominations[0];
      } else if (pd.fixedSenderDenominations?.length) {
        const match = pd.fixedSenderDenominations.find(d => Math.abs(d - requested) < 3);
        finalUnitPrice = match !== undefined ? match : pd.fixedSenderDenominations[0];
      }
      log('INFO', 'UNIT_PRICE_RESOLVED', { requested, finalUnitPrice });
    } catch (e) {
      if (e.message === 'TIMEOUT') {
        log('ERROR', 'RELOADLY_TIMEOUT');
        if (paymentIntentId) await refundStripe(paymentIntentId, 'reloadly_timeout');
        return res.status(503).json({
          error: 'الخدمة غير متاحة حالياً',
          refunded: true,
          refundMessage: '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك',
        });
      }
      log('WARN', 'PRODUCT_FETCH_ERROR', { error: e.message });
    }

    const payload = {
      productId: numericProductId,
      countryCode,
      quantity: parseInt(quantity),
      unitPrice: finalUnitPrice,
      customIdentifier: `bc-${Date.now()}`,
      senderName: 'BridgeCards',
      recipientEmail,
    };

    log('INFO', 'RELOADLY_ORDER_SENDING', payload);

    const orderRes = await fetchWithTimeout(`${RL_BASE}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const order = await orderRes.json();
    log('INFO', 'RELOADLY_ORDER_RESPONSE', { status: order.status, errorCode: order.errorCode });

    // فشل الطلب → Refund تلقائي
    if (order.errorCode || order.status === 'FAILED' || (order.message && !order.transactions)) {
      log('WARN', 'ORDER_FAILED', { errorCode: order.errorCode, message: order.message });
      let refundDone = false;
      if (paymentIntentId) {
        const refund = await refundStripe(paymentIntentId, order.errorCode || 'order_failed');
        refundDone = refund?.status === 'succeeded';
      }
      return res.status(400).json({
        paymentStatus: 'succeeded',
        orderStatus: 'FAILED',
        error: 'فشل شراء الكرت – سيتم إعادة المبلغ',
        refunded: refundDone,
        refundMessage: refundDone
          ? '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك خلال 5-10 أيام عمل'
          : '⚠️ يرجى التواصل معنا: support@bridgecards.org',
      });
    }

    log('INFO', 'ORDER_SUCCESS', { orderId: order.transactionId });
    res.json({ ...order, paymentStatus: 'succeeded', orderStatus: 'SUCCESSFUL' });
  } catch (e) {
    if (e.message === 'TIMEOUT') {
      log('ERROR', 'ORDER_TIMEOUT');
      if (req.body.paymentIntentId) await refundStripe(req.body.paymentIntentId, 'timeout');
      return res.status(503).json({
        error: 'الخدمة غير متاحة حالياً',
        refunded: true,
        refundMessage: '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك',
      });
    }
    log('ERROR', 'ORDER_ERROR', { error: e.message });
    if (req.body.paymentIntentId) await refundStripe(req.body.paymentIntentId, 'server_error');
    res.status(500).json({ error: e.message });
  }
});

// === PRODUCTS LIST ===
app.get('/api/products', async (req, res) => {
  try {
    const token = await getToken();
    const response = await fetchWithTimeout(`${RL_BASE}/products?size=200`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    res.json(await response.json());
  } catch (e) {
    log('ERROR', 'PRODUCTS_ERROR', { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log('INFO', 'SERVER_STARTED', { port: PORT, sandbox: SANDBOX }));
