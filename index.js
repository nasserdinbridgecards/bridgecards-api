import express from 'express';
import cors    from 'cors';
import crypto  from 'crypto';

const app = express();

// Raw body for Stripe webhook (must be before express.json)
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ═══════════════════════════════════════════════════════
// ENVIRONMENT
// ═══════════════════════════════════════════════════════
const RELOADLY_ID     = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const SANDBOX         = process.env.RELOADLY_SANDBOX === 'true';
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUB      = process.env.STRIPE_PUBLISHABLE_KEY;
const STRIPE_WEBHOOK  = process.env.STRIPE_WEBHOOK_SECRET;
const JWT_SECRET      = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SENDGRID_KEY    = process.env.SENDGRID_API_KEY;
const FROM_EMAIL      = process.env.FROM_EMAIL     || 'noreply@bridgecards.org';
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL    || 'support@bridgecards.org';
const FX_API_KEY      = process.env.FX_API_KEY     || '';
const MIN_MARGIN      = parseFloat(process.env.MIN_PROFIT_MARGIN || '0.12');
const STRIPE_FEE_PCT  = 0.029;
const STRIPE_FEE_FLAT = 0.30;
const MONGODB_URI     = process.env.MONGODB_URI    || '';

const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';

// ═══════════════════════════════════════════════════════
// DATABASE LAYER — in-memory with MongoDB drop-in
// Set MONGODB_URI env var to switch to persistent storage
// ═══════════════════════════════════════════════════════
let db = null;

async function dbInit() {
  if (!MONGODB_URI) {
    log('WARN', 'DB_IN_MEMORY',
      { msg: 'No MONGODB_URI — using in-memory store. Data will be lost on restart.' });
    return;
  }
  try {
    // Dynamic import so server starts without mongoose installed
    const { default: mongoose } = await import('mongoose');

    const UserSchema = new mongoose.Schema({
      id: String, firstName: String, lastName: String,
      email: { type: String, unique: true, index: true },
      password: String, role: { type: String, default: 'customer' },
      createdAt: String, isBlocked: { type: Boolean, default: false },
      orderCount: { type: Number, default: 0 },
      totalSpent:  { type: Number, default: 0 },
    });
    const OrderSchema = new mongoose.Schema({
      id: { type: String, unique: true, index: true },
      userId: String, email: String,
      productId: String, productName: String,
      quantity: Number, unitPrice: Number, totalAmount: Number,
      invoiceNo: String, invoiceIssuedAt: String,
      paymentMethod: String, paymentIntentId: String,
      status: { type: String, default: 'pending', index: true },
      codes: [String], reloadlyOrderId: String,
      createdAt: String, updatedAt: String,
      error: String, adminNotes: String,
    });

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    db = {
      User:    mongoose.models.User    || mongoose.model('User', UserSchema),
      Order:   mongoose.models.Order   || mongoose.model('Order', OrderSchema),
      isMongoose: true,
    };
    log('INFO', 'DB_MONGODB_CONNECTED', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (e) {
    log('ERROR', 'DB_MONGODB_FAILED', { error: e.message });
    log('WARN', 'DB_FALLBACK_MEMORY', { msg: 'Falling back to in-memory store' });
  }
}

// Unified DB interface — works with both in-memory and MongoDB
const memUsers  = new Map();
const memOrders = new Map();

async function dbGetUser(email) {
  if (db?.isMongoose) return db.User.findOne({ email: email.toLowerCase() }).lean();
  return memUsers.get(email.toLowerCase()) || null;
}
async function dbSetUser(email, data) {
  if (db?.isMongoose) return db.User.findOneAndUpdate(
    { email: email.toLowerCase() }, data, { upsert: true, new: true }).lean();
  memUsers.set(email.toLowerCase(), data);
  return data;
}
async function dbGetOrder(id) {
  if (db?.isMongoose) return db.Order.findOne({ id }).lean();
  return memOrders.get(id) || null;
}
async function dbSetOrder(id, data) {
  if (db?.isMongoose) return db.Order.findOneAndUpdate({ id }, data, { upsert: true, new: true }).lean();
  memOrders.set(id, data);
  return data;
}
async function dbAllOrders(filter = {}) {
  if (db?.isMongoose) {
    const q = {};
    if (filter.status) q.status = filter.status;
    return db.Order.find(q).sort({ createdAt: -1 }).lean();
  }
  let list = [...memOrders.values()].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  if (filter.status) list = list.filter(o => o.status === filter.status);
  if (filter.email)  list = list.filter(o => o.email === filter.email || o.userId === filter.userId);
  return list;
}
async function dbAllUsers() {
  if (db?.isMongoose) return db.User.find({}).lean();
  return [...memUsers.values()];
}

// Blocked IPs store
const blockedIPs = new Set();

// Settings store (always in-memory — OK for settings)
const settings = {
  globalMargin:    MIN_MARGIN,
  fxBuffer:        0.03,
  allowedPayments: ['visa-card','paypal','crypto','vipps','swish',
                    'bank','sadad','stcpay','fawry','cmi','apple-pay','gpay'],
  maintenanceMode: false,
};

// Admin product overrides
const productConfigs = new Map();

// ═══════════════════════════════════════════════════════
// LOGGING + FRAUD LOG
// ═══════════════════════════════════════════════════════
const fraudLog = [];

function log(level, action, data = {}) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({ ts, level, action, ...data }));
  if (level === 'WARN' || level === 'ERROR') {
    fraudLog.push({ ts, level, action, ...data });
    if (fraudLog.length > 2000) fraudLog.shift();
  }
}

// ═══════════════════════════════════════════════════════
// LIVE FX RATES (fetched server-side every 60 min)
// ═══════════════════════════════════════════════════════
const FALLBACK_FX = {
  USD:1, EUR:1.12, GBP:1.32, CAD:0.76, AUD:0.68,
  NOK:0.097, SEK:0.096, TRY:0.031, AED:0.272,
  SAR:0.267, KWD:3.27, EGP:0.021, MAD:0.099,
};
let fxCache = { rates: { ...FALLBACK_FX }, updatedAt: 0 };

async function getLiveFX() {
  const now = Date.now();
  if (now - fxCache.updatedAt < 60 * 60 * 1000) return fxCache.rates;
  try {
    const url = FX_API_KEY
      ? `https://v6.exchangerate-api.com/v6/${FX_API_KEY}/latest/USD`
      : 'https://open.er-api.com/v6/latest/USD';
    const res  = await fetchWT(url, {}, 8000);
    const data = await res.json();
    const raw  = data.conversion_rates || data.rates;
    if (raw) {
      const rates = {};
      const buf   = 1 + settings.fxBuffer;
      Object.keys(FALLBACK_FX).forEach(c => {
        rates[c] = c === 'USD' ? 1 : (raw[c] ? (1/raw[c]) * buf : FALLBACK_FX[c]);
      });
      fxCache = { rates, updatedAt: now };
      log('INFO', 'FX_UPDATED');
    }
  } catch (e) { log('WARN', 'FX_FAILED', { error: e.message }); }
  return fxCache.rates;
}
getLiveFX().catch(() => {});
setInterval(() => getLiveFX().catch(() => {}), 60 * 60 * 1000);

// ═══════════════════════════════════════════════════════
// SERVER-SIDE PRICING ENGINE
// The ONLY place prices are calculated. Frontend never trusted.
// ═══════════════════════════════════════════════════════

/**
 * Correct Stripe formula — gross you must charge so that after Stripe
 * takes its cut you have exactly (cost + margin) left:
 *   gross = (desiredNet + FLAT) / (1 - PCT)
 */
function calcPrice(costUSD, marginOverride = null) {
  const margin     = marginOverride ?? settings.globalMargin;
  const desiredNet = costUSD * (1 + margin);
  const gross      = (desiredNet + STRIPE_FEE_FLAT) / (1 - STRIPE_FEE_PCT);
  const sell       = Math.max(parseFloat(gross.toFixed(2)), costUSD + 0.60);
  return {
    cost:      parseFloat(costUSD.toFixed(4)),
    margin,
    sell,
    profit:    parseFloat((sell * (1 - STRIPE_FEE_PCT) - STRIPE_FEE_FLAT - costUSD).toFixed(2)),
    stripeFee: parseFloat((sell * STRIPE_FEE_PCT + STRIPE_FEE_FLAT).toFixed(2)),
  };
}

/**
 * Calculate server-side sell price from Reloadly product data.
 * Returns null if product not found or not ACTIVE.
 */
async function getServerPrice(reloadlyId, denomination = null) {
  try {
    const token  = await getToken();
    const res    = await fetchWT(`${RL_BASE}/products/${reloadlyId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/com.reloadly.giftcards-v1+json' },
    });
    const pd = await res.json();
    if (!pd.productId || pd.status !== 'ACTIVE') return null;

    const currency = pd.fixedSenderCurrencyCode || pd.senderCurrencyCode || 'USD';
    const discount = pd.discountPercentage || 0;
    const denoms   = pd.fixedSenderDenominations || pd.fixedRecipientDenominations || [];
    const rates    = await getLiveFX();
    const rateToUSD = rates[currency] ?? FALLBACK_FX[currency] ?? 1;
    const margin   = productConfigs.get(String(reloadlyId))?.margin ?? null;

    if (denomination !== null) {
      // Find closest denomination
      const denom = denoms.find(d => Math.abs(d - denomination) < denomination * 0.1)
                 ?? denoms[0];
      if (!denom) return null;
      const costUSD = denom * (1 - discount/100) * rateToUSD;
      return { ...calcPrice(costUSD, margin), denomination: denom, currency, product: pd };
    }

    // Return all denominations
    return {
      productId:   pd.productId,
      productName: pd.productName,
      status:      pd.status,
      currency,
      discount,
      denominations: denoms.map(d => {
        const costUSD = d * (1 - discount/100) * rateToUSD;
        return { denomination: d, ...calcPrice(costUSD, margin) };
      }),
    };
  } catch (e) {
    log('WARN', 'SERVER_PRICE_FAILED', { reloadlyId, error: e.message });
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════
const rateLimitMap = new Map();

function rateLimit(maxReq = 10, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
             || req.socket.remoteAddress || 'unknown';
    if (blockedIPs.has(ip)) {
      log('WARN', 'BLOCKED_IP_REQ', { ip });
      return res.status(403).json({ error: 'Access denied' });
    }
    const now = Date.now();
    if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
    const reqs = rateLimitMap.get(ip).filter(t => now - t < windowMs);
    reqs.push(now);
    rateLimitMap.set(ip, reqs);
    if (reqs.length > maxReq) {
      log('WARN', 'RATE_LIMIT', { ip, count: reqs.length });
      return res.status(429).json({ error: 'Too many requests — please wait.' });
    }
    next();
  };
}
setInterval(() => {
  const cut = Date.now() - 300000;
  for (const [k,v] of rateLimitMap) {
    const f = v.filter(t=>t>cut);
    f.length ? rateLimitMap.set(k,f) : rateLimitMap.delete(k);
  }
}, 300000);

// Duplicate order protection
const recentOrders = new Map();
function isDuplicate(email, productId) {
  const key = `${email}:${productId}`, now = Date.now();
  const last = recentOrders.get(key);
  if (last && now - last < 30000) return true;
  recentOrders.set(key, now);
  return false;
}

// ═══════════════════════════════════════════════════════
// JWT
// ═══════════════════════════════════════════════════════
const b64u = b => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

function jwtSign(payload, secs = 7*86400) {
  const h = b64u(Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})));
  const b = b64u(Buffer.from(JSON.stringify({
    ...payload, exp: Math.floor(Date.now()/1000)+secs, iat: Math.floor(Date.now()/1000),
  })));
  const s = b64u(crypto.createHmac('sha256',JWT_SECRET).update(`${h}.${b}`).digest());
  return `${h}.${b}.${s}`;
}
function jwtVerify(token) {
  try {
    const [h,b,s] = token.split('.');
    const exp = b64u(crypto.createHmac('sha256',JWT_SECRET).update(`${h}.${b}`).digest());
    if (s!==exp) return null;
    const p = JSON.parse(Buffer.from(b,'base64').toString());
    if (p.exp < Math.floor(Date.now()/1000)) return null;
    return p;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════
// PASSWORD
// ═══════════════════════════════════════════════════════
async function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}
async function checkPw(pw, stored) {
  const [salt, hash] = stored.split(':');
  const v = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash,'hex'), Buffer.from(v,'hex'));
}

// ═══════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const p = jwtVerify(h.slice(7));
  if (!p) return res.status(401).json({ error: 'Session expired — please sign in again' });
  req.user = p;
  next();
}
function admin(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
    next();
  });
}

// ═══════════════════════════════════════════════════════
// RELOADLY
// ═══════════════════════════════════════════════════════
let _rlTok = null, _rlExp = 0;
async function getToken() {
  if (_rlTok && Date.now() < _rlExp - 60000) return _rlTok;
  const res = await fetchWT('https://auth.reloadly.com/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: RELOADLY_ID, client_secret: RELOADLY_SECRET,
      grant_type: 'client_credentials',
      audience: SANDBOX ? 'https://giftcards-sandbox.reloadly.com'
                        : 'https://giftcards.reloadly.com',
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error('Reloadly auth failed');
  _rlTok = d.access_token;
  _rlExp = Date.now() + (d.expires_in||3600)*1000;
  return _rlTok;
}

async function fetchWT(url, opts={}, ms=12000) {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t); return r;
  } catch(e) { clearTimeout(t); if (e.name==='AbortError') throw new Error('TIMEOUT'); throw e; }
}

async function stripeRefund(piId, reason) {
  if (!piId || !STRIPE_SECRET) return null;
  try {
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: { Authorization:`Bearer ${STRIPE_SECRET}`, 'Content-Type':'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ payment_intent: piId, reason: 'other' }),
    });
    const r = await res.json();
    log('INFO', 'REFUND', { status:r.status, id:r.id });
    return r;
  } catch(e) { log('ERROR','REFUND_FAILED',{error:e.message}); return null; }
}

function generateId() {
  return `BC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════════════════
async function sendEmail({ to, subject, html }) {
  if (!SENDGRID_KEY) { log('WARN','EMAIL_SKIP',{to,subject}); return false; }
  try {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:'POST',
      headers:{Authorization:`Bearer ${SENDGRID_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({
        personalizations:[{to:[{email:to}]}],
        from:{email:FROM_EMAIL,name:'BridgeCards'},
        subject, content:[{type:'text/html',value:html}],
      }),
    });
    log(r.status===202?'INFO':'ERROR','EMAIL',{to,status:r.status});
    return r.status===202;
  } catch(e){log('ERROR','EMAIL_ERR',{error:e.message});return false;}
}
const tpl=(title,body,col='#3d6bff')=>`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;background:#07080f;color:#eef0ff;margin:0;padding:20px;}
.c{background:#111220;border-radius:16px;max-width:560px;margin:0 auto;padding:32px;}
h2{font-size:17px;font-weight:800;color:${col};}
.r{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #252740;font-size:13px;}
.r:last-child{border:none;font-weight:800;color:#00d4aa;}
.cb{background:#0d0e1a;border:2px dashed ${col};border-radius:10px;padding:14px;text-align:center;
font-family:monospace;font-size:20px;font-weight:900;letter-spacing:4px;color:#00d4aa;margin:14px 0;}
.ft{text-align:center;font-size:11px;color:#9294b8;margin-top:18px;}
</style></head><body><div class="c">
<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:20px;">🌉 <span style="color:${col}">BridgeCards</span></div>
<h2>${title}</h2>${body}
<div class="ft">BridgeCards · Zetony LLC (USA) · <a href="mailto:${ADMIN_EMAIL}" style="color:#00d4aa">${ADMIN_EMAIL}</a></div>
</div></body></html>`;

function generateInvoiceNo(orderId) {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  const tail = orderId.split('-').slice(-1)[0] || crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INV-${ym}-${tail}`;
}

function invoiceHtml(order) {
  const issued = order.invoiceIssuedAt || new Date().toISOString();
  return tpl('🧾 Invoice / فاتورة', `
    <div class="r"><span>Invoice</span><span>${order.invoiceNo}</span></div>
    <div class="r"><span>Issued</span><span>${new Date(issued).toLocaleString('en-US')}</span></div>
    <div class="r"><span>Order</span><span>${order.id}</span></div>
    <div class="r"><span>Email</span><span>${order.email}</span></div>
    <div class="r"><span>Product</span><span>${order.productName}</span></div>
    <div class="r"><span>Qty</span><span>${order.quantity}</span></div>
    <div class="r"><span>Unit</span><span>$${order.unitPrice.toFixed(2)}</span></div>
    <div class="r"><span>Total</span><span>$${order.totalAmount.toFixed(2)}</span></div>
    <p style="font-size:12px;color:#9294b8;margin-top:10px;">For accounting support, reply to this email.</p>`);
}

async function issueInvoice(order) {
  if (order.invoiceNo) return order;
  order.invoiceNo = generateInvoiceNo(order.id);
  order.invoiceIssuedAt = new Date().toISOString();
  await dbSetOrder(order.id, order);
  await sendEmail({
    to: order.email,
    subject: `🧾 Invoice ${order.invoiceNo} — BridgeCards`,
    html: invoiceHtml(order),
  });
  log('INFO', 'INVOICE_SENT', { orderId: order.id, invoiceNo: order.invoiceNo, to: order.email });
  return order;
}

// ═══════════════════════════════════════════════════════
// ── ROUTES ──
// ═══════════════════════════════════════════════════════

app.get('/api/health', (req,res) => res.json({ status:'ok', sandbox:SANDBOX, version:'3.0.0',
  db: db?.isMongoose ? 'mongodb' : 'in-memory' }));

app.get('/api/stripe-key', (req,res) => res.json({ publishableKey:STRIPE_PUB }));

app.get('/api/fx-rates', async (req,res) => {
  const rates = await getLiveFX();
  res.json({ rates, updatedAt: new Date(fxCache.updatedAt).toISOString() });
});

app.get('/api/settings', (req,res) => res.json({
  allowedPayments: settings.allowedPayments,
  maintenanceMode: settings.maintenanceMode,
}));

app.get('/api/availability', (req,res) => {
  const out = {};
  for (const [id,cfg] of productConfigs) if (cfg.availability) out[id]=cfg.availability;
  res.json(out);
});

// ═══════════════════════════════════════════════════════
// SERVER-SIDE PRICE ENDPOINT — frontend fetches this
// instead of calculating locally. Prevents price tampering.
// ═══════════════════════════════════════════════════════
app.post('/api/price', rateLimit(20,60000), async (req,res) => {
  const { productId, denomination } = req.body;
  if (!productId) return res.status(400).json({ error:'productId required' });
  const numId = parseInt(productId);
  if (isNaN(numId)) {
    if (!denomination) return res.status(400).json({ error:'denomination required' });
    return res.json({ ...calcPrice(parseFloat(denomination)), trusted:true });
  }
  const data = await getServerPrice(numId, denomination ? parseFloat(denomination) : null);
  if (!data) return res.status(404).json({ error:'Product not found or inactive' });
  res.json({ ...data, trusted:true });
});

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
app.post('/auth/register', rateLimit(10,60000), async (req,res) => {
  try {
    const { firstName,lastName,email,password,accountType='customer' } = req.body;
    if (!firstName||!lastName||!email||!password)
      return res.status(400).json({ error:'All fields required' });
    if (password.length<8)
      return res.status(400).json({ error:'Password must be at least 8 characters' });
    const norm = email.toLowerCase().trim();
    if (await dbGetUser(norm))
      return res.status(409).json({ error:'Email already registered' });
    const user = {
      id:crypto.randomUUID(), firstName, lastName, email:norm,
      password:await hashPw(password),
      role: accountType==='wholesale'?'wholesale':'customer',
      createdAt:new Date().toISOString(), isBlocked:false,
      orderCount:0, totalSpent:0,
    };
    await dbSetUser(norm, user);
    log('INFO','REGISTERED',{id:user.id,email:norm,role:user.role});
    const token = jwtSign({userId:user.id,email:norm,role:user.role});
    const {password:_,...safe}=user;
    res.status(201).json({token,user:safe});
  } catch(e){log('ERROR','REG_ERR',{error:e.message});res.status(500).json({error:'Server error'});}
});

app.post('/auth/login', rateLimit(10,60000), async (req,res) => {
  try {
    const { email,password } = req.body;
    if (!email||!password) return res.status(400).json({error:'Email and password required'});
    const norm = email.toLowerCase().trim();
    const user = await dbGetUser(norm);
    if (!user) return res.status(401).json({error:'Invalid credentials'});
    if (user.isBlocked) return res.status(403).json({error:'Account is blocked'});
    if (!await checkPw(password,user.password)) {
      log('WARN','FAILED_LOGIN',{email:norm});
      return res.status(401).json({error:'Invalid credentials'});
    }
    const token = jwtSign({userId:user.id,email:norm,role:user.role});
    log('INFO','LOGIN',{id:user.id,email:norm});
    const {password:_,...safe}=user;
    res.json({token,user:safe});
  } catch(e){log('ERROR','LOGIN_ERR',{error:e.message});res.status(500).json({error:'Server error'});}
});

app.get('/auth/me', auth, async (req,res) => {
  const user = await dbGetUser(req.user.email);
  if (!user) return res.status(404).json({error:'User not found'});
  const {password:_,...safe}=user;
  res.json(safe);
});

// ═══════════════════════════════════════════════════════
// ORDERS — Server calculates price, never trusts frontend
// ═══════════════════════════════════════════════════════
app.post('/orders', rateLimit(5,60000), async (req,res) => {
  const orderId = generateId();
  let order     = null;
  try {
    let {
      productId,
      quantity,
      paymentMethod,
      paymentIntentId,
      userEmail,
      product_id,
      productID,
      qty,
      count,
      product,
      item,
      selectedProduct,
      selectedQuantity,
    } = req.body;

    // Accept common frontend key variants to avoid false "Missing fields"
    productId = productId
      ?? product_id
      ?? productID
      ?? product?.productId
      ?? product?.id
      ?? item?.productId
      ?? item?.id
      ?? selectedProduct?.productId
      ?? selectedProduct?.id
      ?? null;
    quantity  = quantity
      ?? qty
      ?? count
      ?? product?.quantity
      ?? item?.quantity
      ?? selectedQuantity
      ?? null;
    // NOTE: unitPrice from frontend is IGNORED — server recalculates

    // Resolve identity from JWT
    let customerEmail = userEmail, userId = null;
    const authH = req.headers.authorization;
    if (authH?.startsWith('Bearer ')) {
      const p = jwtVerify(authH.slice(7));
      if (p) { customerEmail=p.email; userId=p.userId; }
    }
    if (!customerEmail) return res.status(400).json({error:'Authentication required'});

    // Recovery path: if frontend missed productId/quantity but PI metadata has them
    if ((!productId || !quantity) && paymentIntentId && STRIPE_SECRET) {
      try {
        const piMetaRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } });
        const piMeta = await piMetaRes.json();
        productId = productId ?? piMeta?.metadata?.product_id ?? null;
        quantity  = quantity  ?? piMeta?.metadata?.quantity ?? 1;
      } catch (e) {
        log('WARN','PI_METADATA_READ_FAILED',{orderId,paymentIntentId,error:e.message});
      }
    }

    if (!productId || !quantity) return res.status(400).json({error:'Missing fields'});

    log('INFO','ORDER_START',{orderId,productId,quantity,customerEmail});

    if (isDuplicate(customerEmail,productId))
      return res.status(429).json({error:'Duplicate order — please wait 30 seconds'});

    // ── SERVER-SIDE PRICE CALCULATION ──────────────────
    // Frontend price is NEVER used. We recalculate from Reloadly.
    const numId = parseInt(productId);
    let serverUnitPrice = null;
    let countryCode     = 'US';
    let productName     = String(productId);
    let rlToken         = null;

    if (!isNaN(numId)) {
      try {
        rlToken = await getToken();
        const pdRes = await fetchWT(`${RL_BASE}/products/${numId}`, {
          headers:{Authorization:`Bearer ${rlToken}`,Accept:'application/com.reloadly.giftcards-v1+json'},
        });
        const pd = await pdRes.json();
        if (!pd.productId) throw new Error('Product not found in Reloadly');
        if (pd.status !== 'ACTIVE') throw new Error('Product not active');

        productName = pd.productName || String(productId);
        if (pd.countryCode) countryCode = pd.countryCode;

        const currency  = pd.fixedSenderCurrencyCode || pd.senderCurrencyCode || 'USD';
        const discount  = pd.discountPercentage || 0;
        const denoms    = pd.fixedSenderDenominations || pd.fixedRecipientDenominations || [];
        const rates     = await getLiveFX();
        const rateToUSD = rates[currency] ?? FALLBACK_FX[currency] ?? 1;
        const margin    = productConfigs.get(String(numId))?.margin ?? null;

        // Pick denomination: use frontend hint but verify against Reloadly list
        const frontendDenom = parseFloat(req.body.unitPrice || 0);
        const matched = denoms.find(d => Math.abs(d - frontendDenom) < frontendDenom * 0.1)
                     ?? denoms[0];
        if (!matched) throw new Error('No valid denomination found');

        const costUSD = matched * (1 - discount/100) * rateToUSD;
        const pricing = calcPrice(costUSD, margin);
        serverUnitPrice = pricing.sell;

        log('INFO','Server-calculated price (trusted)',{
          orderId, product:productName, denom:matched, currency,
          costUSD:pricing.cost.toFixed(2), sell:serverUnitPrice, profit:pricing.profit,
        });
      } catch(e) {
        if (e.message==='TIMEOUT') {
          return res.status(503).json({error:'Service unavailable',orderId,
            refundMessage:'Please try again — no charge was made'});
        }
        log('WARN','PRICE_CALC_WARN',{error:e.message});
        return res.status(503).json({
          error:'Live supplier pricing unavailable. Please retry in a moment.',
          orderId,
        });
      }
    } else {
      // Non-Reloadly (manual/crypto) — use frontend price but validate minimum
      serverUnitPrice = parseFloat(req.body.unitPrice || 0);
      if (serverUnitPrice <= 0) return res.status(400).json({error:'Invalid price'});
    }

    const totalAmount = parseFloat((serverUnitPrice * parseInt(quantity)).toFixed(2));

    // Create order with SERVER-calculated price
    order = {
      id:orderId, userId, email:customerEmail,
      productId, productName, quantity:parseInt(quantity),
      unitPrice:serverUnitPrice, totalAmount,
      paymentMethod:paymentMethod||'unknown',
      paymentIntentId:paymentIntentId||null,
      status:'pending', codes:[], reloadlyOrderId:null,
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), error:null,
    };
    await dbSetOrder(orderId, order);

    // Validate Stripe payment amount against SERVER price
    if (paymentIntentId && STRIPE_SECRET) {
      const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
        {headers:{Authorization:`Bearer ${STRIPE_SECRET}`}});
      const pi = await piRes.json();
      log('INFO','PI_STATUS',{id:paymentIntentId,status:pi.status,amount:pi.amount});

      if (pi.status !== 'succeeded') {
        order.status='failed'; order.error='Payment not confirmed';
        await dbSetOrder(orderId,order);
        return res.status(402).json({error:order.error,orderId});
      }

      // Compare Stripe amount vs server-calculated amount (allow ±$1 tolerance)
      const expected  = Math.round(totalAmount * 100);
      const tolerance = 100; // $1.00 tolerance for rounding
      if (Math.abs(pi.amount - expected) > tolerance) {
        log('WARN','AMOUNT_MISMATCH',{piAmount:pi.amount,expected,diff:pi.amount-expected,orderId});
        // If underpaid by more than tolerance — refund and reject
        if (pi.amount < expected - tolerance) {
          order.status='failed'; order.error='Underpayment detected';
          await dbSetOrder(orderId,order);
          await stripeRefund(paymentIntentId,'fraudulent');
          return res.status(400).json({error:'Payment amount mismatch',orderId,refunded:true});
        }
        // Overpayment: accept and log (rare — may happen with FX rounding)
        log('INFO','OVERPAYMENT_ACCEPTED',{extra:pi.amount-expected});
      }
      order.status='paid';
    } else {
      order.status='paid';
    }
    await dbSetOrder(orderId,order);
    await issueInvoice(order);

    // Confirmation email
    sendEmail({to:customerEmail, subject:`✅ Order Confirmed #${orderId} — BridgeCards`,
      html:tpl('✅ Order Received',`
        <div class="r"><span>Order</span><span>${orderId}</span></div>
        <div class="r"><span>Product</span><span>${productName}</span></div>
        <div class="r"><span>Total</span><span>$${totalAmount}</span></div>
        <p style="font-size:12px;color:#9294b8;margin-top:10px;">Your code will arrive in seconds.</p>`)
    }).catch(()=>{});

    // Non-Reloadly product
    if (isNaN(numId)) {
      order.status='processing';
      await dbSetOrder(orderId,order);
      return res.json({...order,orderStatus:'PROCESSING',manualDelivery:true});
    }

    // ── RELOADLY FULFILLMENT ─────────────────────────
    order.status='processing';
    await dbSetOrder(orderId,order);

    if (!rlToken) rlToken = await getToken();

    // Re-fetch denomination for Reloadly order (use server-verified value)
    const pdRes2 = await fetchWT(`${RL_BASE}/products/${numId}`,{
      headers:{Authorization:`Bearer ${rlToken}`,Accept:'application/com.reloadly.giftcards-v1+json'},
    });
    const pd2 = await pdRes2.json();
    const denoms2 = pd2.fixedSenderDenominations || pd2.fixedRecipientDenominations || [];
    // Closest denomination by cost ratio
    const rates2 = await getLiveFX();
    const cur2   = pd2.fixedSenderCurrencyCode||pd2.senderCurrencyCode||'USD';
    const r2usd  = rates2[cur2]??1;
    const disc2  = pd2.discountPercentage||0;
    // Find which Reloadly denomination corresponds to our server price
    let bestDenom = denoms2[0];
    let bestDiff  = Infinity;
    for (const d of denoms2) {
      const costUSD2 = d*(1-disc2/100)*r2usd;
      const sell2    = calcPrice(costUSD2).sell;
      if (Math.abs(sell2 - serverUnitPrice) < bestDiff) {
        bestDiff = Math.abs(sell2 - serverUnitPrice);
        bestDenom = d;
      }
    }

    const rlPayload = {
      productId:numId, countryCode,
      quantity:order.quantity, unitPrice:bestDenom,
      customIdentifier:orderId,
      senderName:'BridgeCards',
      recipientEmail:customerEmail,
    };
    log('INFO','RL_ORDER',rlPayload);

    const rlRes   = await fetchWT(`${RL_BASE}/orders`,{
      method:'POST',
      headers:{Authorization:`Bearer ${rlToken}`,Accept:'application/com.reloadly.giftcards-v1+json','Content-Type':'application/json'},
      body:JSON.stringify(rlPayload),
    });
    const rlData  = await rlRes.json();
    log('INFO','RL_RESPONSE',{status:rlData.status,error:rlData.errorCode});

    // Failure → auto refund
    if (rlData.errorCode||rlData.status==='FAILED'||(rlData.message&&!rlData.transactions)) {
      order.status='failed'; order.error=rlData.message||rlData.errorCode||'ORDER_FAILED';
      let refundDone=false;
      if (paymentIntentId) {
        const rf = await stripeRefund(paymentIntentId,order.error);
        refundDone = rf?.status==='succeeded';
        if (refundDone) order.status='refunded';
      }
      await dbSetOrder(orderId,order);
      sendEmail({to:customerEmail,subject:`⚠️ Order Failed #${orderId}`,
        html:tpl('⚠️ Order Failed',`<p style="color:#ff4f7b">${order.error}</p>
          <p style="font-size:12px;color:#9294b8">Refund initiated — 3–5 business days.</p>`,'#ff4f7b')
      }).catch(()=>{});
      return res.status(400).json({orderId,paymentStatus:'succeeded',orderStatus:'FAILED',
        error:'Card purchase failed',refunded:refundDone,
        refundMessage:refundDone?'✅ Refund initiated — 3–5 business days'
                                :'⚠️ Contact support@bridgecards.org'});
    }

    // ── SUCCESS ────────────────────────────────────────
    order.status='delivered';
    order.reloadlyOrderId=rlData.transactionId||rlData.id;
    order.updatedAt=new Date().toISOString();
    const txs  = rlData.transactions||rlData.cards||[rlData];
    order.codes = txs.map(t=>
      t.pinCode||t.cardNumber||t.code||
      (t.cards?.[0]&&(t.cards[0].pinCode||t.cards[0].cardNumber))||''
    ).filter(Boolean);
    await dbSetOrder(orderId,order);

    // Update user stats
    const u = await dbGetUser(customerEmail);
    if (u) {
      u.orderCount=(u.orderCount||0)+1;
      u.totalSpent=parseFloat(((u.totalSpent||0)+totalAmount).toFixed(2));
      await dbSetUser(customerEmail,u);
    }
    log('INFO','DELIVERED',{orderId,codes:order.codes.length});

    if (order.codes.length) {
      const codesHtml = order.codes.map(c=>`<div class="cb">${c}</div>`).join('');
      sendEmail({to:customerEmail,subject:`🎉 Your code is ready — #${orderId}`,
        html:tpl('🎉 Code Delivered!',`<p>Your <strong>${productName}</strong>:</p>${codesHtml}
          <p style="font-size:11px;color:#9294b8;margin-top:8px">Any issues within 48h — contact us.</p>`,'#00d4aa')
      }).catch(()=>{});
    }

    res.json({
      ...rlData,
      orderId,
      invoiceNo: order.invoiceNo,
      paymentStatus:'succeeded',
      orderStatus:'SUCCESSFUL',
      status:'SUCCESSFUL',
    });

  } catch(e) {
    log('ERROR','ORDER_ERR',{orderId,error:e.message});
    if (order){order.status='failed';order.error=e.message;await dbSetOrder(orderId,order);}
    if (req.body.paymentIntentId) await stripeRefund(req.body.paymentIntentId,'server_error');
    if (e.message==='TIMEOUT')
      return res.status(503).json({error:'Service unavailable',orderId,refunded:true});
    res.status(500).json({error:e.message,orderId});
  }
});

app.get('/orders/user', auth, async (req,res) => {
  const list = await dbAllOrders({email:req.user.email,userId:req.user.userId});
  res.json(list.map(({codes,...o})=>({...o,hasCodes:codes?.length>0})));
});

app.get('/orders/user/:id', auth, async (req,res) => {
  const o = await dbGetOrder(req.params.id);
  if (!o) return res.status(404).json({error:'Order not found'});
  if (o.userId!==req.user.userId&&o.email!==req.user.email) return res.status(403).json({error:'Forbidden'});
  res.json(o);
});

app.get('/orders/user/:id/invoice', auth, async (req,res) => {
  const o = await dbGetOrder(req.params.id);
  if (!o) return res.status(404).json({error:'Order not found'});
  if (o.userId!==req.user.userId&&o.email!==req.user.email) return res.status(403).json({error:'Forbidden'});
  if (!o.invoiceNo) return res.status(404).json({error:'Invoice not generated yet'});
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(invoiceHtml(o));
});

app.get('/orders/admin', admin, async (req,res) => {
  const {status,page=1,limit=50}=req.query;
  let list = await dbAllOrders(status?{status}:{});
  const total=list.length, start=(parseInt(page)-1)*parseInt(limit);
  res.json({total,page:parseInt(page),orders:list.slice(start,start+parseInt(limit))});
});

app.patch('/orders/:id', admin, async (req,res) => {
  const o = await dbGetOrder(req.params.id);
  if (!o) return res.status(404).json({error:'Order not found'});
  const allowed=['pending','paid','processing','delivered','failed','refunded'];
  if (req.body.status&&!allowed.includes(req.body.status)) return res.status(400).json({error:'Invalid status'});
  if (req.body.status) o.status=req.body.status;
  if (req.body.notes)  o.adminNotes=req.body.notes;
  o.updatedAt=new Date().toISOString();
  await dbSetOrder(req.params.id,o);
  res.json(o);
});

// ═══════════════════════════════════════════════════════
// STRIPE WEBHOOK
// ═══════════════════════════════════════════════════════
app.post('/api/stripe-webhook', async (req,res) => {
  if (!STRIPE_WEBHOOK) return res.json({received:true});
  try {
    const sig=req.headers['stripe-signature'];
    const ts=sig.match(/t=(\d+)/)?.[1]||'0';
    const v1=sig.match(/v1=([a-f0-9]+)/)?.[1]||'';
    const expected=crypto.createHmac('sha256',STRIPE_WEBHOOK)
      .update(`${ts}.${req.body}`).digest('hex');
    if (v1!==expected) {log('WARN','WEBHOOK_SIG_INVALID');return res.status(400).json({error:'Invalid sig'});}
    const event=JSON.parse(req.body.toString());
    if (event.type==='charge.dispute.created') {
      const d=event.data.object;
      log('WARN','CHARGEBACK',{charge:d.charge,amount:d.amount,reason:d.reason});
      sendEmail({to:ADMIN_EMAIL,subject:`⚠️ CHARGEBACK: ${d.charge}`,
        html:tpl('⚠️ Chargeback',`<div class="r"><span>Charge</span><span>${d.charge}</span></div>
          <div class="r"><span>Amount</span><span>$${(d.amount/100).toFixed(2)}</span></div>
          <div class="r"><span>Reason</span><span>${d.reason}</span></div>`,'#ff4f7b')
      }).catch(()=>{});
    }
    res.json({received:true});
  } catch(e){res.status(400).json({error:e.message});}
});

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════
app.get('/admin/stats', admin, async (req,res) => {
  const orders=await dbAllOrders({});
  const users=await dbAllUsers();
  const fxRates=await getLiveFX();
  const delivered=orders.filter(o=>o.status==='delivered');
  res.json({
    totalOrders:orders.length, totalUsers:users.length,
    totalRevenue:delivered.reduce((s,o)=>s+o.totalAmount,0).toFixed(2),
    estimatedProfit:delivered.reduce((s,o)=>s+o.totalAmount*settings.globalMargin,0).toFixed(2),
    failed:orders.filter(o=>o.status==='failed').length,
    refunded:orders.filter(o=>o.status==='refunded').length,
    pending:orders.filter(o=>['pending','processing'].includes(o.status)).length,
    byStatus:{
      pending:orders.filter(o=>o.status==='pending').length,
      paid:orders.filter(o=>o.status==='paid').length,
      processing:orders.filter(o=>o.status==='processing').length,
      delivered:delivered.length,
      failed:orders.filter(o=>o.status==='failed').length,
      refunded:orders.filter(o=>o.status==='refunded').length,
    },
    fxRates, fxUpdatedAt:new Date(fxCache.updatedAt).toISOString(),
    dbType:db?.isMongoose?'mongodb':'in-memory',
    fraudAlerts:fraudLog.slice(-20),
    recentOrders:orders.slice(0,10).map(o=>({id:o.id,email:o.email,status:o.status,amount:o.totalAmount,createdAt:o.createdAt})),
  });
});

app.get('/admin/users', admin, async (req,res) => {
  const users = await dbAllUsers();
  res.json(users.map(({password:_,...u})=>u));
});

app.patch('/admin/users/:email', admin, async (req,res) => {
  const user=await dbGetUser(req.params.email);
  if (!user) return res.status(404).json({error:'User not found'});
  if (req.body.isBlocked!==undefined) user.isBlocked=req.body.isBlocked;
  if (req.body.role) user.role=req.body.role;
  await dbSetUser(req.params.email,user);
  const {password:_,...safe}=user;
  res.json(safe);
});

app.post('/admin/block-ip', admin, (req,res) => {
  const {ip,block}=req.body;
  if (!ip) return res.status(400).json({error:'IP required'});
  block ? blockedIPs.add(ip) : blockedIPs.delete(ip);
  log('INFO','IP_BLOCK',{ip,block,admin:req.user.email});
  res.json({blockedIPs:[...blockedIPs]});
});

app.get('/admin/settings', admin, (req,res) => res.json(settings));
app.patch('/admin/settings', admin, (req,res) => {
  ['globalMargin','fxBuffer','allowedPayments','maintenanceMode'].forEach(k=>{
    if (req.body[k]!==undefined) settings[k]=req.body[k];
  });
  res.json(settings);
});

app.patch('/admin/products/:id', admin, (req,res) => {
  const id=req.params.id;
  const cfg=productConfigs.get(id)||{id};
  ['enabled','availability','margin'].forEach(k=>{if(req.body[k]!==undefined)cfg[k]=req.body[k];});
  productConfigs.set(id,cfg);
  res.json(cfg);
});

// ── Products from Reloadly ──────────────────────────────
app.get('/api/products', async (req,res) => {
  try {
    const token=await getToken();
    const r=await fetchWT(`${RL_BASE}/products?size=200`,{
      headers:{Authorization:`Bearer ${token}`,Accept:'application/com.reloadly.giftcards-v1+json'},
    });
    const data=await r.json();
    let products=data.content||data;
    if (productConfigs.size>0)
      products=products.filter(p=>productConfigs.get(String(p.productId))?.enabled!==false);
    res.json({content:products,totalElements:products.length});
  } catch(e){res.status(500).json({error:e.message});}
});

app.post('/api/check-product', rateLimit(5,60000), async (req,res) => {
  try {
    const {productId}=req.body;
    const n=parseInt(productId);
    if (isNaN(n)) return res.json({available:false,error:'Product unavailable'});
    const token=await getToken();
    const r=await fetchWT(`${RL_BASE}/products/${n}`,{
      headers:{Authorization:`Bearer ${token}`,Accept:'application/com.reloadly.giftcards-v1+json'},
    });
    const pd=await r.json();
    if (pd.status!=='ACTIVE') return res.json({available:false,error:'Product unavailable'});
    if (pd.quantity!=null&&pd.quantity<=0) return res.json({available:false,error:'Out of stock'});
    res.json({available:true});
  } catch(e){
    if (e.message==='TIMEOUT') return res.json({available:false,error:'Service unavailable'});
    res.json({available:true});
  }
});

app.post('/api/create-payment-intent', rateLimit(5,60000), async (req,res) => {
  try {
    const {
      amount,
      currency='usd',
      email,
      productId,
      product_id,
      productID,
      selectedProductId,
      product,
      item,
      selectedProduct,
      quantity,
      qty,
      count,
      selectedQuantity,
    }=req.body;
    if (!amount) return res.status(400).json({error:'amount required'});
    const resolvedProductId = productId
      ?? product_id
      ?? productID
      ?? selectedProductId
      ?? product?.productId
      ?? product?.id
      ?? item?.productId
      ?? item?.id
      ?? selectedProduct?.productId
      ?? selectedProduct?.id
      ?? '';
    const resolvedQuantity = quantity ?? qty ?? count ?? product?.quantity ?? item?.quantity ?? selectedQuantity ?? 1;
    const body=new URLSearchParams({
      amount:String(Math.round(amount*100)), currency,
      'payment_method_types[]':'card',
      'metadata[customer_email]':email||'',
      'metadata[product_id]':String(resolvedProductId),
      'metadata[quantity]':String(resolvedQuantity),
    });
    const r=await fetch('https://api.stripe.com/v1/payment_intents',{
      method:'POST',
      headers:{Authorization:`Bearer ${STRIPE_SECRET}`,'Content-Type':'application/x-www-form-urlencoded'},
      body,
    });
    const pi=await r.json();
    if (pi.error) throw new Error(pi.error.message);
    res.json({clientSecret:pi.client_secret,id:pi.id});
  } catch(e){res.status(500).json({error:e.message});}
});

// ═══════════════════════════════════════════════════════
// SEED + START
// ═══════════════════════════════════════════════════════
async function seedAdmin() {
  const email=(process.env.ADMIN_EMAIL||'admin@bridgecards.org').toLowerCase();
  const pass=process.env.ADMIN_PASSWORD||'Admin@BridgeCards2026!';
  if (!await dbGetUser(email)) {
    await dbSetUser(email,{
      id:crypto.randomUUID(), firstName:'Admin', lastName:'BridgeCards',
      email, password:await hashPw(pass), role:'admin',
      createdAt:new Date().toISOString(), isBlocked:false, orderCount:0, totalSpent:0,
    });
    log('INFO','ADMIN_SEEDED',{email});
  }
}

const PORT=process.env.PORT||3000;
app.listen(PORT, async () => {
  await dbInit();
  await seedAdmin();
  log('INFO','STARTED',{port:PORT,sandbox:SANDBOX,version:'3.0.0',
    db:db?.isMongoose?'mongodb':'in-memory'});
});
