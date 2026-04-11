import { MONGODB_URI } from '../config.js';
import { log, attachLogWriter, attachRecentAlertsReader } from '../utils/logger.js';

/** Mongoose model container. Populated by `initDb()` when MONGODB_URI is set. */
let db = null;

function assertDbReady() {
  if (!db?.isMongoose) {
    throw new Error('Database is not initialized');
  }
}

async function ensureIndexes() {
  await Promise.all([
    db.User.syncIndexes(),
    db.Order.syncIndexes(),
    db.Log.syncIndexes(),
  ]);
  log('INFO', 'DB_INDEXES_SYNCED');
}

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB when MONGODB_URI is set; otherwise stay in-memory.
 * Safe to call multiple times (idempotent).
 */
export async function initDb() {
  if (db) return; // already initialised
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Refusing to start without persistent storage.');
  }

  try {
    const { default: mongoose } = await import('mongoose');

    const UserSchema = new mongoose.Schema({
      id: String,
      firstName: String,
      lastName: String,
      email: { type: String, unique: true, index: true },
      password: String,
      role: { type: String, default: 'customer' },
      createdAt: String,
      isBlocked: { type: Boolean, default: false },
      orderCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    });

    const OrderSchema = new mongoose.Schema({
      id: { type: String, unique: true, index: true },
      userId: String,
      email: String,
      productId: String,
      productName: String,
      quantity: Number,
      unitPrice: Number,
      totalAmount: Number,
      invoiceNo: String,
      invoiceIssuedAt: String,
      paymentMethod: String,
      paymentIntentId: String,
      status: { type: String, default: 'pending', index: true },
      codes: [String],
      reloadlyOrderId: String,
      createdAt: String,
      updatedAt: String,
      error: String,
      adminNotes: String,
    });

    const LogSchema = new mongoose.Schema({
      ts: { type: Date, default: Date.now, index: true },
      level: { type: String, index: true },
      action: { type: String, index: true },
      orderId: { type: String, index: true },
      paymentIntentId: { type: String, index: true },
    }, { strict: false });

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
    db = {
      User: mongoose.models.User || mongoose.model('User', UserSchema),
      Order: mongoose.models.Order || mongoose.model('Order', OrderSchema),
      Log: mongoose.models.Log || mongoose.model('Log', LogSchema),
      isMongoose: true,
    };
    await ensureIndexes();
    attachLogWriter(async (entry) => {
      await db.Log.create({ ...entry, ts: new Date(entry.ts) });
    });
    attachRecentAlertsReader(async (n) => db.Log
      .find({ level: { $in: ['WARN', 'ERROR'] } })
      .sort({ ts: -1 })
      .limit(n)
      .lean());
    log('INFO', 'DB_MONGODB_CONNECTED', {
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***@'),
    });
  } catch (err) {
    log('ERROR', 'DB_MONGODB_FAILED', { error: err.message });
    throw err;
  }
}

/** Expose raw db handle (useful for health checks). */
export function getDbHandle() { return db; }

// ── Unified CRUD interface ────────────────────────────────────────────────────

export async function dbGetUser(email) {
  assertDbReady();
  return db.User.findOne({ email: email.toLowerCase() }).lean();
}

export async function dbSetUser(email, data) {
  assertDbReady();
  return db.User.findOneAndUpdate(
    { email: email.toLowerCase() },
    data,
    { upsert: true, new: true },
  ).lean();
}

export async function dbGetOrder(id) {
  assertDbReady();
  return db.Order.findOne({ id }).lean();
}

export async function dbGetOrderByPaymentIntent(paymentIntentId) {
  assertDbReady();
  return db.Order.findOne({ paymentIntentId }).lean();
}

export async function dbSetOrder(id, data) {
  assertDbReady();
  return db.Order.findOneAndUpdate({ id }, data, { upsert: true, new: true }).lean();
}

/**
 * Retrieve all orders, optionally filtered.
 *
 * Supported filter keys: `status`, `email`, `userId`.
 */
export async function dbAllOrders(filter = {}) {
  assertDbReady();
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.email) query.email = filter.email;
  if (filter.userId) query.userId = filter.userId;
  return db.Order.find(query).sort({ createdAt: -1 }).lean();
}

export async function dbAllUsers() {
  assertDbReady();
  return db.User.find({}).lean();
}
