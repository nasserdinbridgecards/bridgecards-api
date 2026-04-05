import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════
// ENVIRONMENT
// ═══════════════════════════════════════════════════════════
const RELOADLY_ID     = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const SANDBOX         = process.env.RELOADLY_SANDBOX === 'true';
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUB      = process.env.STRIPE_PUBLISHABLE_KEY;
const JWT_SECRET      = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SENDGRID_KEY    = process.env.SENDGRID_API_KEY;
const FROM_EMAIL      = process.env.FROM_EMAIL || 'noreply@bridgecards.org';
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL || 'support@bridgecards.org';
const MIN_MARGIN      = parseFloat(process.env.MIN_PROFIT_MARGIN || '0.10'); // 10%

const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';

// ═══════════════════════════════════════════════════════════
// IN-MEMORY DATA STORE (replace with MongoDB/PostgreSQL in prod)
// Schema matches production DB structure for easy migration
// ═══════════════════════════════════════════════════════════
const DB = {
  users:    new Map(), // email → UserRecord
  orders:   new Map(), // orderId → OrderRecord
  products: new Map(), // productId → ProductRecord (admin-controlled)
  settings: {
    globalMargin:    0.10,   // 10%
    stripeFeeRate:   0.029,
    stripeFeeFixed:  0.30,
    allowedPayments: ['visa-card','paypal','crypto','vipps','swish','bank','sadad','stcpay','fawry','cmi','apple-pay','gpay'],
    maintenanceMode: false,
  },
};

// ═══════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════
function log(level, action, data = {}) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, level, action, ...data }));
}

// ═══════════════════════════════════════════════════════════
// JWT HELPERS (no external dependency — pure crypto)
// ═══════════════════════════════════════════════════════════
function b64url(buf) {
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function jwtSign(payload, expiresInSec = 7 * 86400) {
  const header  = b64url(Buffer.from(JSON.stringify({ alg:'HS256', typ:'JWT' })));
  const body    = b64url(Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now()/1000)+expiresInSec, iat: Math.floor(Date.now()/1000) })));
  const sig     = b64url(crypto.createHmac('sha256', JWT_SECRET).update(header+'.'+body).digest());
  return `${header}.${body}.${sig}`;
}

function jwtVerify(token) {
  try {
    const [h, b, s] = token.split('.');
    const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(h+'.'+b).digest());
    if (s !== expected) return null;
    const payload = JSON.parse(Buffer.from(b, 'base64').toString());
    if (payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════
// PASSWORD HASHING (bcrypt-compatible without native module)
// Uses PBKDF2 with SHA-256 — production-grade
// ═══════════════════════════════════════════════════════════
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
}

// ═══════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح — يرجى تسجيل الدخول' });
  }
  const payload = jwtVerify(authHeader.slice(7));
  if (!payload) return res.status(401).json({ error: 'الجلسة منتهية — يرجى إعادة تسجيل الدخول' });
  req.user = payload;
  next();
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح — صلاحيات المشرف مطلوبة' });
    next();
  });
}

// ═══════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════
const rateLimitMap = new Map();
function rateLimit(maxReq = 5, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (!rateLimitMap.has(key)) rateLimitMap.set(key, []);
    const reqs = rateLimitMap.get(key).filter(t => now - t < windowMs);
    reqs.push(now);
    rateLimitMap.set(key, reqs);
    if (reqs.length > maxReq) {
      log('WARN', 'RATE_LIMIT', { key });
      return res.status(429).json({ error: 'طلبات كثيرة جداً، يرجى الانتظار دقيقة.' });
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════
// DUPLICATE ORDER PROTECTION
// ═══════════════════════════════════════════════════════════
const recentOrders = new Map();
function isDuplicateOrder(email, productId) {
  const key = `${email}:${productId}`;
  const now = Date.now();
  const last = recentOrders.get(key);
  if (last && now - last < 30000) return true;
  recentOrders.set(key, now);
  return false;
}

// ═══════════════════════════════════════════════════════════
// ORDER ID GENERATOR
// ═══════════════════════════════════════════════════════════
function generateOrderId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BC-${ts}-${rand}`;
}

// ═══════════════════════════════════════════════════════════
// PRICING ENGINE
// ═══════════════════════════════════════════════════════════
function calcSellPrice(costUSD, margin = null) {
  const m  = margin ?? DB.settings.globalMargin;
  const wp = costUSD * (1 + m);
  const sf = wp * DB.settings.stripeFeeRate + DB.settings.stripeFeeFixed;
  const fp = parseFloat((wp + sf).toFixed(2));
  return {
    cost:    costUSD,
    margin:  m,
    sell:    Math.max(fp, costUSD + 0.50),
    profit:  parseFloat((Math.max(fp, costUSD + 0.50) - costUSD).toFixed(2)),
  };
}

function assertNoLoss(sellPrice, costPrice) {
  const minSell = costPrice * (1 + MIN_MARGIN);
  if (sellPrice < minSell) {
    log('ERROR', 'LOSS_PREVENTED', { sellPrice, costPrice, minSell });
    throw new Error(`LOSS_PREVENTION: sell=${sellPrice} < min=${minSell.toFixed(2)}`);
  }
}

// ═══════════════════════════════════════════════════════════
// EMAIL SYSTEM (SendGrid)
// ═══════════════════════════════════════════════════════════
async function sendEmail({ to, subject, html, text }) {
  if (!SENDGRID_KEY) {
    log('WARN', 'EMAIL_SKIPPED', { reason: 'no SENDGRID_KEY', to, subject });
    return false;
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: 'BridgeCards' },
        subject,
        content: [
          { type: 'text/html', value: html },
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    });
    const ok = res.status === 202;
    log(ok ? 'INFO' : 'ERROR', 'EMAIL_SENT', { to, subject, status: res.status });
    return ok;
  } catch (e) {
    log('ERROR', 'EMAIL_ERROR', { error: e.message });
    return false;
  }
}

function emailTemplate({ title, body, orderId, color = '#3d6bff' }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
body{font-family:'Cairo',Arial,sans-serif;background:#07080f;color:#eef0ff;margin:0;padding:20px;}
.card{background:#111220;border-radius:16px;max-width:560px;margin:0 auto;padding:32px;}
.logo{font-size:22px;font-weight:900;color:#fff;margin-bottom:24px;}
.logo span{color:${color};}
h2{font-size:18px;font-weight:800;margin-bottom:16px;color:${color};}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #252740;font-size:14px;}
.row:last-child{border:none;font-weight:800;font-size:16px;color:#00d4aa;}
.code-box{background:#0d0e1a;border:2px dashed ${color};border-radius:10px;padding:16px;text-align:center;font-family:monospace;font-size:20px;font-weight:900;letter-spacing:4px;color:#00d4aa;margin:16px 0;}
.footer{text-align:center;font-size:11px;color:#9294b8;margin-top:24px;}
.badge{display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:800;}
</style></head>
<body>
<div class="card">
  <div class="logo">🌉 <span>BridgeCards</span></div>
  <h2>${title}</h2>
  ${body}
  <div class="footer">
    BridgeCards · Zetony LLC (USA) · <a href="mailto:support@bridgecards.org" style="color:#00d4aa;">support@bridgecards.org</a>
  </div>
</div>
</body></html>`;
}

async function sendOrderConfirmation(order) {
  const html = emailTemplate({
    title: '✅ تم استلام طلبك',
    orderId: order.id,
    body: `
      <div class="row"><span>رقم الطلب</span><span class="badge">${order.id}</span></div>
      <div class="row"><span>المنتج</span><span>${order.productName || order.productId}</span></div>
      <div class="row"><span>الكمية</span><span>${order.quantity}</span></div>
      <div class="row"><span>طريقة الدفع</span><span>${order.paymentMethod}</span></div>
      <div class="row"><span>الإجمالي</span><span>$${order.totalAmount}</span></div>
      <p style="font-size:13px;color:#9294b8;margin-top:16px;">سيصلك الكود خلال ثوانٍ في رسالة منفصلة.</p>
    `,
    color: '#3d6bff',
  });
  await sendEmail({ to: order.email, subject: `✅ تأكيد الطلب #${order.id} — BridgeCards`, html });
}

async function sendCodeDelivery(email, orderId, codes, productName) {
  const codesHtml = codes.map(code =>
    `<div class="code-box">${code}</div>`
  ).join('');
  const html = emailTemplate({
    title: '🎉 تم تسليم كودك!',
    orderId,
    body: `
      <p style="font-size:14px;margin-bottom:16px;">مبروك! كود <strong>${productName}</strong> جاهز:</p>
      ${codesHtml}
      <p style="font-size:12px;color:#9294b8;margin-top:12px;">
        انقر على الكود لنسخه. في حال أي مشكلة خلال 48 ساعة يرجى التواصل معنا.
      </p>
    `,
    color: '#00d4aa',
  });
  await sendEmail({ to: email, subject: `🎉 كودك جاهز — الطلب #${orderId}`, html });
}

async function sendRefundNotification(email, orderId, amount, reason) {
  const html = emailTemplate({
    title: '↩️ تم استرداد المبلغ',
    orderId,
    body: `
      <div class="row"><span>رقم الطلب</span><span class="badge">${orderId}</span></div>
      <div class="row"><span>المبلغ المسترد</span><span style="color:#00d4aa;">$${amount}</span></div>
      <div class="row"><span>السبب</span><span>${reason || 'فشل في التسليم'}</span></div>
      <p style="font-size:13px;color:#9294b8;margin-top:16px;">سيظهر المبلغ في حسابك خلال 3-5 أيام عمل.</p>
    `,
    color: '#ff4f7b',
  });
  await sendEmail({ to: email, subject: `↩️ استرداد المبلغ — الطلب #${orderId}`, html });
}

async function sendFailedOrderNotification(email, orderId, error) {
  const html = emailTemplate({
    title: '⚠️ فشل تنفيذ الطلب',
    orderId,
    body: `
      <div class="row"><span>رقم الطلب</span><span class="badge">${orderId}</span></div>
      <p style="font-size:13px;color:#ff4f7b;margin-top:12px;">للأسف فشل تنفيذ طلبك بسبب: ${error}</p>
      <p style="font-size:13px;color:#9294b8;">تم استرداد مبلغك تلقائياً. للمساعدة:
        <a href="mailto:support@bridgecards.org" style="color:#3d6bff;">support@bridgecards.org</a>
      </p>
    `,
    color: '#ff4f7b',
  });
  await sendEmail({ to: email, subject: `⚠️ فشل الطلب #${orderId} — BridgeCards`, html });
}

// ═══════════════════════════════════════════════════════════
// RELOADLY HELPERS
// ═══════════════════════════════════════════════════════════
let _rlToken = null, _rlTokenExp = 0;
async function getToken() {
  if (_rlToken && Date.now() < _rlTokenExp - 60000) return _rlToken;
  const res = await fetchWithTimeout('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: RELOADLY_ID, client_secret: RELOADLY_SECRET,
      grant_type: 'client_credentials',
      audience: SANDBOX ? 'https://giftcards-sandbox.reloadly.com' : 'https://giftcards.reloadly.com',
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error('Reloadly auth failed');
  _rlToken    = d.access_token;
  _rlTokenExp = Date.now() + (d.expires_in || 3600) * 1000;
  return _rlToken;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('TIMEOUT');
    throw e;
  }
}

async function refundStripe(paymentIntentId, reason) {
  if (!paymentIntentId || !STRIPE_SECRET) return null;
  try {
    log('INFO', 'REFUND_INITIATED', { paymentIntentId, reason });
    const body = new URLSearchParams({ payment_intent: paymentIntentId, reason: 'other' });
    const res  = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
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

// ═══════════════════════════════════════════════════════════
// ── ROUTES ──
// ═══════════════════════════════════════════════════════════

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sandbox: SANDBOX, version: '2.0.0' });
});

// ── STRIPE PUBLIC KEY ──────────────────────────────────────
app.get('/api/stripe-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUB });
});

// ── SETTINGS (public) ──────────────────────────────────────
app.get('/api/settings', (req, res) => {
  res.json({
    allowedPayments: DB.settings.allowedPayments,
    maintenanceMode: DB.settings.maintenanceMode,
  });
});

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// POST /auth/register
app.post('/auth/register', rateLimit(10, 60000), async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType = 'customer' } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });

    if (password.length < 8)
      return res.status(400).json({ error: 'كلمة المرور 8 أحرف على الأقل' });

    const emailNorm = email.toLowerCase().trim();
    if (DB.users.has(emailNorm))
      return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });

    const hashedPw = await hashPassword(password);
    const user = {
      id:          crypto.randomUUID(),
      firstName,
      lastName,
      email:       emailNorm,
      password:    hashedPw,
      role:        accountType === 'wholesale' ? 'wholesale' : 'customer',
      createdAt:   new Date().toISOString(),
      isBlocked:   false,
    };

    DB.users.set(emailNorm, user);
    log('INFO', 'USER_REGISTERED', { id: user.id, email: emailNorm, role: user.role });

    const token = jwtSign({ userId: user.id, email: emailNorm, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, firstName, lastName, email: emailNorm, role: user.role },
    });
  } catch (e) {
    log('ERROR', 'REGISTER_ERROR', { error: e.message });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /auth/login
app.post('/auth/login', rateLimit(10, 60000), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });

    const emailNorm = email.toLowerCase().trim();
    const user = DB.users.get(emailNorm);
    if (!user) return res.status(401).json({ error: 'بيانات خاطئة' });
    if (user.isBlocked) return res.status(403).json({ error: 'الحساب محظور' });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'بيانات خاطئة' });

    const token = jwtSign({ userId: user.id, email: emailNorm, role: user.role });
    log('INFO', 'USER_LOGIN', { id: user.id, email: emailNorm });

    res.json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: emailNorm, role: user.role },
    });
  } catch (e) {
    log('ERROR', 'LOGIN_ERROR', { error: e.message });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /auth/me
app.get('/auth/me', authMiddleware, (req, res) => {
  const user = DB.users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ═══════════════════════════════════════════════════════════
// ORDER ROUTES
// ═══════════════════════════════════════════════════════════

// POST /orders — create order
app.post('/orders', rateLimit(5, 60000), async (req, res) => {
  const orderId = generateOrderId();
  let   order   = null;

  try {
    const { productId, quantity, unitPrice, paymentMethod, paymentIntentId, userEmail } = req.body;

    // Auth: use JWT if available, fallback to userEmail for guest checkout
    let customerEmail = userEmail;
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = jwtVerify(authHeader.slice(7));
      if (payload) { customerEmail = payload.email; userId = payload.userId; }
    }

    if (!customerEmail) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    if (!productId || !quantity || !unitPrice)
      return res.status(400).json({ error: 'بيانات ناقصة' });

    log('INFO', 'ORDER_START', { orderId, productId, quantity, unitPrice, customerEmail });

    // Duplicate protection
    if (isDuplicateOrder(customerEmail, productId)) {
      log('WARN', 'DUPLICATE_ORDER', { customerEmail, productId });
      return res.status(429).json({ error: 'طلب مكرر — انتظر 30 ثانية' });
    }

    // Create order record (pending)
    order = {
      id:            orderId,
      userId,
      email:         customerEmail,
      productId,
      productName:   null,
      quantity:      parseInt(quantity),
      unitPrice:     parseFloat(unitPrice),
      totalAmount:   parseFloat((parseFloat(unitPrice) * parseInt(quantity)).toFixed(2)),
      paymentMethod: paymentMethod || 'unknown',
      paymentIntentId: paymentIntentId || null,
      status:        'pending',
      codes:         [],
      reloadlyOrderId: null,
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      error:         null,
    };
    DB.orders.set(orderId, order);

    // Validate Stripe payment
    if (paymentIntentId && STRIPE_SECRET) {
      const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
      });
      const pi = await piRes.json();
      log('INFO', 'PAYMENT_INTENT_STATUS', { id: paymentIntentId, status: pi.status });

      if (pi.status !== 'succeeded') {
        order.status = 'failed';
        order.error  = 'لم يتم تأكيد الدفع';
        DB.orders.set(orderId, order);
        return res.status(402).json({ error: order.error, orderId });
      }

      // Amount verification
      const expected = Math.round(order.totalAmount * 100);
      if (pi.amount && Math.abs(pi.amount - expected) > 50) {
        log('WARN', 'AMOUNT_MISMATCH', { piAmount: pi.amount, expected });
        order.status = 'failed';
        order.error  = 'مبلغ الدفع غير متطابق';
        DB.orders.set(orderId, order);
        await refundStripe(paymentIntentId, 'amount_mismatch');
        return res.status(400).json({ error: order.error, orderId });
      }

      order.status = 'paid';
    } else {
      // Non-Stripe payment (crypto/bank) — mark as paid manually
      order.status = 'paid';
    }
    DB.orders.set(orderId, order);

    // Send order confirmation email
    sendOrderConfirmation(order).catch(() => {});

    // Process Reloadly if product has numeric ID
    const numericId = parseInt(productId);
    if (isNaN(numericId)) {
      // Non-Reloadly product (crypto/manual) — mark for manual delivery
      order.status = 'processing';
      DB.orders.set(orderId, order);
      log('INFO', 'ORDER_MANUAL', { orderId, productId });
      return res.json({ ...order, orderStatus: 'PROCESSING', manualDelivery: true });
    }

    // ── RELOADLY FULFILLMENT ────────────────────────────────
    order.status = 'processing';
    DB.orders.set(orderId, order);

    const token = await getToken();

    // Fetch product details for pricing validation
    let finalUnitPrice = parseFloat(unitPrice);
    let countryCode    = 'US';
    try {
      const pdRes = await fetchWithTimeout(`${RL_BASE}/products/${numericId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json' },
      });
      const pd = await pdRes.json();
      order.productName = pd.productName || productId;
      if (pd.countryCode) countryCode = pd.countryCode;

      // NO-LOSS VALIDATION
      const rlCost = pd.fixedSenderDenominations?.[0] || pd.fixedRecipientDenominations?.[0];
      if (rlCost) {
        try { assertNoLoss(finalUnitPrice, rlCost); } catch (lossErr) {
          order.status = 'failed';
          order.error  = 'خطأ في التسعير';
          DB.orders.set(orderId, order);
          await refundStripe(paymentIntentId, 'pricing_error');
          await sendFailedOrderNotification(customerEmail, orderId, 'خطأ في التسعير');
          return res.status(400).json({ error: 'خطأ في التسعير — تم استرداد المبلغ', orderId });
        }
      }

      // Resolve exact denomination
      if (pd.fixedSenderDenominations?.length) {
        const match = pd.fixedSenderDenominations.find(d => Math.abs(d - finalUnitPrice) < 5);
        finalUnitPrice = match !== undefined ? match : pd.fixedSenderDenominations[0];
      }
    } catch (e) {
      if (e.message === 'TIMEOUT') {
        order.status = 'failed'; order.error = 'TIMEOUT';
        DB.orders.set(orderId, order);
        await refundStripe(paymentIntentId, 'reloadly_timeout');
        await sendFailedOrderNotification(customerEmail, orderId, 'انتهت مهلة الاتصال');
        return res.status(503).json({ error: 'الخدمة غير متاحة', orderId, refunded: true, refundMessage: '✅ تم استرداد المبلغ تلقائياً' });
      }
      log('WARN', 'PRODUCT_FETCH_WARN', { error: e.message });
    }

    // Place Reloadly order
    const rlPayload = {
      productId:        numericId,
      countryCode,
      quantity:         order.quantity,
      unitPrice:        finalUnitPrice,
      customIdentifier: orderId,
      senderName:       'BridgeCards',
      recipientEmail:   customerEmail,
    };
    log('INFO', 'RELOADLY_ORDER', rlPayload);

    const rlRes   = await fetchWithTimeout(`${RL_BASE}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(rlPayload),
    });
    const rlOrder = await rlRes.json();
    log('INFO', 'RELOADLY_RESPONSE', { status: rlOrder.status, errorCode: rlOrder.errorCode });

    // Reloadly failed → refund
    if (rlOrder.errorCode || rlOrder.status === 'FAILED' || (rlOrder.message && !rlOrder.transactions)) {
      order.status = 'failed';
      order.error  = rlOrder.message || rlOrder.errorCode || 'ORDER_FAILED';
      DB.orders.set(orderId, order);

      let refundDone = false;
      if (paymentIntentId) {
        const refund = await refundStripe(paymentIntentId, order.error);
        refundDone = refund?.status === 'succeeded';
        if (refundDone) order.status = 'refunded';
        DB.orders.set(orderId, order);
      }
      await sendFailedOrderNotification(customerEmail, orderId, order.error);
      if (refundDone) await sendRefundNotification(customerEmail, orderId, order.totalAmount, order.error);

      return res.status(400).json({
        orderId,
        paymentStatus: 'succeeded',
        orderStatus:   'FAILED',
        error:         'فشل شراء الكرت',
        refunded:      refundDone,
        refundMessage: refundDone
          ? '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك خلال 5-10 أيام عمل'
          : '⚠️ يرجى التواصل: support@bridgecards.org',
      });
    }

    // ── SUCCESS ─────────────────────────────────────────────
    order.status         = 'delivered';
    order.reloadlyOrderId = rlOrder.transactionId || rlOrder.id;
    order.updatedAt      = new Date().toISOString();

    // Extract codes
    const transactions = rlOrder.transactions || rlOrder.cards || [rlOrder];
    order.codes = transactions.map(t =>
      t.pinCode || t.cardNumber || t.code ||
      (t.cards?.[0] && (t.cards[0].pinCode || t.cards[0].cardNumber)) || ''
    ).filter(Boolean);

    DB.orders.set(orderId, order);
    log('INFO', 'ORDER_DELIVERED', { orderId, codes: order.codes.length });

    // Send delivery email
    if (order.codes.length > 0) {
      sendCodeDelivery(customerEmail, orderId, order.codes, order.productName || String(productId)).catch(() => {});
    }

    res.json({
      ...rlOrder,
      orderId,
      paymentStatus: 'succeeded',
      orderStatus:   'SUCCESSFUL',
      status:        'SUCCESSFUL',
    });
  } catch (e) {
    log('ERROR', 'ORDER_ERROR', { orderId, error: e.message });
    if (order) { order.status = 'failed'; order.error = e.message; DB.orders.set(orderId, order); }
    const refund = req.body.paymentIntentId ? await refundStripe(req.body.paymentIntentId, 'server_error') : null;
    if (req.body.userEmail || req.user?.email) {
      await sendFailedOrderNotification(req.body.userEmail || req.user?.email, orderId, 'خطأ في الخادم');
    }
    if (e.message === 'TIMEOUT') {
      return res.status(503).json({ error: 'الخدمة غير متاحة', orderId, refunded: !!refund, refundMessage: '✅ تم استرداد المبلغ تلقائياً' });
    }
    res.status(500).json({ error: e.message, orderId, refunded: !!refund });
  }
});

// GET /orders/user — user's orders
app.get('/orders/user', authMiddleware, (req, res) => {
  const userOrders = [...DB.orders.values()]
    .filter(o => o.userId === req.user.userId || o.email === req.user.email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ codes, ...o }) => ({ ...o, hasCodes: codes.length > 0 })); // hide codes in list
  res.json(userOrders);
});

// GET /orders/user/:id — single order with codes
app.get('/orders/user/:id', authMiddleware, (req, res) => {
  const order = DB.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
  if (order.userId !== req.user.userId && order.email !== req.user.email)
    return res.status(403).json({ error: 'غير مصرح' });
  res.json(order);
});

// GET /orders/admin — all orders (admin)
app.get('/orders/admin', adminMiddleware, (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  let orders = [...DB.orders.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status) orders = orders.filter(o => o.status === status);
  const total = orders.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  res.json({ total, page: parseInt(page), orders: orders.slice(start, start + parseInt(limit)) });
});

// PATCH /orders/:id — update status (admin)
app.patch('/orders/:id', adminMiddleware, (req, res) => {
  const order = DB.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
  const { status, notes } = req.body;
  const allowed = ['pending','paid','processing','delivered','failed','refunded'];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
  if (status) order.status = status;
  if (notes)  order.adminNotes = notes;
  order.updatedAt = new Date().toISOString();
  DB.orders.set(req.params.id, order);
  log('INFO', 'ORDER_UPDATED_ADMIN', { orderId: req.params.id, status, admin: req.user.email });
  res.json(order);
});

// ═══════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// GET /admin/stats — analytics
app.get('/admin/stats', adminMiddleware, (req, res) => {
  const orders = [...DB.orders.values()];
  const users  = [...DB.users.values()];

  const stats = {
    totalOrders:     orders.length,
    totalUsers:      users.length,
    totalRevenue:    orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0).toFixed(2),
    failedOrders:    orders.filter(o => o.status === 'failed').length,
    refundedOrders:  orders.filter(o => o.status === 'refunded').length,
    pendingOrders:   orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    byStatus: {
      pending:    orders.filter(o => o.status === 'pending').length,
      paid:       orders.filter(o => o.status === 'paid').length,
      processing: orders.filter(o => o.status === 'processing').length,
      delivered:  orders.filter(o => o.status === 'delivered').length,
      failed:     orders.filter(o => o.status === 'failed').length,
      refunded:   orders.filter(o => o.status === 'refunded').length,
    },
    recentOrders: orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(o => ({ id: o.id, email: o.email, status: o.status, amount: o.totalAmount, createdAt: o.createdAt })),
  };
  res.json(stats);
});

// GET /admin/users
app.get('/admin/users', adminMiddleware, (req, res) => {
  const users = [...DB.users.values()].map(({ password: _, ...u }) => u);
  res.json(users);
});

// PATCH /admin/users/:email — block/unblock
app.patch('/admin/users/:email', adminMiddleware, (req, res) => {
  const user = DB.users.get(req.params.email);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  if (req.body.isBlocked !== undefined) user.isBlocked = req.body.isBlocked;
  if (req.body.role) user.role = req.body.role;
  DB.users.set(req.params.email, user);
  log('INFO', 'USER_UPDATED_ADMIN', { email: req.params.email, ...req.body, admin: req.user.email });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// GET /admin/settings
app.get('/admin/settings', adminMiddleware, (req, res) => {
  res.json(DB.settings);
});

// PATCH /admin/settings
app.patch('/admin/settings', adminMiddleware, (req, res) => {
  const allowed = ['globalMargin','stripeFeeRate','stripeFeeFixed','allowedPayments','maintenanceMode'];
  allowed.forEach(k => { if (req.body[k] !== undefined) DB.settings[k] = req.body[k]; });
  log('INFO', 'SETTINGS_UPDATED', { changes: req.body, admin: req.user.email });
  res.json(DB.settings);
});

// ═══════════════════════════════════════════════════════════
// PRODUCT ROUTES (existing + admin control)
// ═══════════════════════════════════════════════════════════

// GET /api/products — live from Reloadly (filtered by admin)
app.get('/api/products', async (req, res) => {
  try {
    const token    = await getToken();
    const response = await fetchWithTimeout(`${RL_BASE}/products?size=200`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json' },
    });
    const data = await response.json();

    // Filter: only admin-enabled products (if any set)
    let products = data.content || data;
    if (DB.products.size > 0) {
      products = products.filter(p => {
        const cfg = DB.products.get(String(p.productId));
        return !cfg || cfg.enabled !== false;
      });
    }
    res.json({ content: products, totalElements: products.length });
  } catch (e) {
    log('ERROR', 'PRODUCTS_ERROR', { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/availability — product availability map
app.get('/api/availability', async (req, res) => {
  try {
    const avail = {};
    for (const [id, cfg] of DB.products.entries()) {
      if (cfg.availability) avail[id] = cfg.availability;
    }
    res.json(avail);
  } catch (e) {
    res.json({});
  }
});

// PATCH /admin/products/:id — enable/disable, set availability, margin
app.patch('/admin/products/:id', adminMiddleware, (req, res) => {
  const id  = req.params.id;
  const cfg = DB.products.get(id) || { id };
  const allowed = ['enabled','availability','margin','name'];
  allowed.forEach(k => { if (req.body[k] !== undefined) cfg[k] = req.body[k]; });
  DB.products.set(id, cfg);
  log('INFO', 'PRODUCT_UPDATED', { id, ...req.body, admin: req.user.email });
  res.json(cfg);
});

// ═══════════════════════════════════════════════════════════
// LEGACY ENDPOINTS (backward compatible)
// ═══════════════════════════════════════════════════════════

app.post('/api/check-product', rateLimit(5, 60000), async (req, res) => {
  try {
    const { productId } = req.body;
    const numericId = parseInt(productId);
    if (isNaN(numericId)) return res.json({ available: false, error: 'الكرت غير متوفر حالياً' });

    const token     = await getToken();
    const productRes = await fetchWithTimeout(`${RL_BASE}/products/${numericId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json' },
    });
    const pd = await productRes.json();
    log('INFO', 'CHECK_PRODUCT', { name: pd.productName, status: pd.status });

    if (pd.status !== 'ACTIVE') return res.json({ available: false, error: 'الكرت غير متوفر حالياً' });
    if (pd.quantity !== undefined && pd.quantity !== null && pd.quantity <= 0)
      return res.json({ available: false, error: 'الكرت نفد من المخزون' });

    res.json({ available: true });
  } catch (e) {
    if (e.message === 'TIMEOUT') return res.json({ available: false, error: 'الخدمة غير متاحة حالياً' });
    res.json({ available: true });
  }
});

app.post('/api/create-payment-intent', rateLimit(5, 60000), async (req, res) => {
  try {
    const { amount, currency = 'usd', email, productId } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    const body = new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency,
      'payment_method_types[]': 'card',
      'metadata[customer_email]': email || '',
      'metadata[product_id]': productId || '',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const pi = await response.json();
    if (pi.error) throw new Error(pi.error.message);
    log('INFO', 'PAYMENT_INTENT_CREATED', { id: pi.id, amount });
    res.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (e) {
    log('ERROR', 'PAYMENT_INTENT_ERROR', { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/order', rateLimit(5, 60000), async (req, res) => {
  // Forward to new orders endpoint
  req.body.userEmail = req.body.recipientEmail;
  return app._router.handle(Object.assign(req, { url: '/orders', method: 'POST' }), res, () => {});
});

// ═══════════════════════════════════════════════════════════
// SEED ADMIN USER (dev/first run)
// ═══════════════════════════════════════════════════════════
async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@bridgecards.org').toLowerCase();
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@BridgeCards2026!';
  if (!DB.users.has(adminEmail)) {
    const hashed = await hashPassword(adminPass);
    DB.users.set(adminEmail, {
      id: crypto.randomUUID(), firstName: 'Admin', lastName: 'BridgeCards',
      email: adminEmail, password: hashed, role: 'admin',
      createdAt: new Date().toISOString(), isBlocked: false,
    });
    log('INFO', 'ADMIN_SEEDED', { email: adminEmail });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await seedAdmin();
  log('INFO', 'SERVER_STARTED', { port: PORT, sandbox: SANDBOX, version: '2.0.0' });
});
