import { MONGODB_URI } from '../config.js';
import { log } from '../utils/logger.js';

// ── In-memory fallback stores ─────────────────────────────────────────────────
const memUsers  = new Map();
const memOrders = new Map();

/** Mongoose model container. Populated by `initDb()` when MONGODB_URI is set. */
let db = null;

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB when MONGODB_URI is set; otherwise stay in-memory.
 * Safe to call multiple times (idempotent).
 */
export async function initDb() {
  if (db) return; // already initialised
  if (!MONGODB_URI) {
    log('WARN', 'DB_IN_MEMORY', {
      msg: 'No MONGODB_URI — using in-memory store. Data will be lost on restart.',
    });
    return;
  }

  try {
    const { default: mongoose } = await import('mongoose');

    const UserSchema = new mongoose.Schema({
      id:          String,
      firstName:   String,
      lastName:    String,
      email:       { type: String, unique: true, index: true },
      password:    String,
      role:        { type: String, default: 'customer' },
      createdAt:   String,
      isBlocked:   { type: Boolean, default: false },
      orderCount:  { type: Number,  default: 0 },
      totalSpent:  { type: Number,  default: 0 },
    });

    const OrderSchema = new mongoose.Schema({
      id:              { type: String, unique: true, index: true },
      userId:          String,
      email:           String,
      productId:       String,
      productName:     String,
      quantity:        Number,
      unitPrice:       Number,
      totalAmount:     Number,
      invoiceNo:       String,
      invoiceIssuedAt: String,
      paymentMethod:   String,
      paymentIntentId: String,
      status:          { type: String, default: 'pending', index: true },
      codes:           [String],
      reloadlyOrderId: String,
      createdAt:       String,
      updatedAt:       String,
      error:           String,
      adminNotes:      String,
    });

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
    db = {
      User:       mongoose.models.User  || mongoose.model('User', UserSchema),
      Order:      mongoose.models.Order || mongoose.model('Order', OrderSchema),
      isMongoose: true,
    };
    log('INFO', 'DB_MONGODB_CONNECTED', {
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***@'),
    });
  } catch (err) {
    log('ERROR', 'DB_MONGODB_FAILED',  { error: err.message });
    log('WARN',  'DB_FALLBACK_MEMORY', { msg: 'Falling back to in-memory store' });
  }
}

/** Expose raw db handle (useful for health checks). */
export function getDbHandle() { return db; }

// ── Unified CRUD interface ────────────────────────────────────────────────────

export async function dbGetUser(email) {
  if (db?.isMongoose) return db.User.findOne({ email: email.toLowerCase() }).lean();
  return memUsers.get(email.toLowerCase()) ?? null;
}

export async function dbSetUser(email, data) {
  if (db?.isMongoose) {
    return db.User.findOneAndUpdate(
      { email: email.toLowerCase() },
      data,
      { upsert: true, new: true },
    ).lean();
  }
  memUsers.set(email.toLowerCase(), data);
  return data;
}

export async function dbGetOrder(id) {
  if (db?.isMongoose) return db.Order.findOne({ id }).lean();
  return memOrders.get(id) ?? null;
}

export async function dbSetOrder(id, data) {
  if (db?.isMongoose) {
    return db.Order.findOneAndUpdate({ id }, data, { upsert: true, new: true }).lean();
  }
  memOrders.set(id, data);
  return data;
}

/**
 * Retrieve all orders, optionally filtered.
 *
 * Supported filter keys: `status`, `email`, `userId`.
 */
export async function dbAllOrders(filter = {}) {
  if (db?.isMongoose) {
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.email)  query.email  = filter.email;
    if (filter.userId) query.userId = filter.userId;
    return db.Order.find(query).sort({ createdAt: -1 }).lean();
  }

  let list = [...memOrders.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  if (filter.status) {
    list = list.filter((o) => o.status === filter.status);
  }
  if (filter.email || filter.userId) {
    list = list.filter(
      (o) =>
        (filter.email  && o.email  === filter.email) ||
        (filter.userId && o.userId === filter.userId),
    );
  }
  return list;
}

export async function dbAllUsers() {
  if (db?.isMongoose) return db.User.find({}).lean();
  return [...memUsers.values()];
}
