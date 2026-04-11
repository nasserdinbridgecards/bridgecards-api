import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
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
}, { collection: 'users' });

const orderSchema = new mongoose.Schema({
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
}, { collection: 'orders' });

const logSchema = new mongoose.Schema({
    ts: { type: Date, default: Date.now, index: true },
    level: { type: String, index: true },
    action: { type: String, index: true },
    orderId: { type: String, index: true },
    paymentIntentId: { type: String, index: true },
}, { strict: false, collection: 'logs' });

const User = mongoose.models.BackfillUser || mongoose.model('BackfillUser', userSchema);
const Order = mongoose.models.BackfillOrder || mongoose.model('BackfillOrder', orderSchema);
const Log = mongoose.models.BackfillLog || mongoose.model('BackfillLog', logSchema);

async function main() {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    const now = new Date().toISOString();

    const orderDefaultsResult = await Order.updateMany(
        {
            $or: [
                { adminNotes: { $exists: false } },
                { error: { $exists: false } },
                { updatedAt: { $exists: false } },
            ],
        },
        {
            $set: {
                adminNotes: null,
                error: null,
            },
            $setOnInsert: {
                updatedAt: now,
            },
        },
    );

    await Order.updateMany(
        { updatedAt: { $exists: false }, createdAt: { $exists: true } },
        [
            {
                $set: {
                    updatedAt: '$createdAt',
                },
            },
        ],
    );

    await User.updateMany(
        {
            $or: [
                { orderCount: { $exists: false } },
                { totalSpent: { $exists: false } },
                { isBlocked: { $exists: false } },
            ],
        },
        {
            $set: {
                orderCount: 0,
                totalSpent: 0,
                isBlocked: false,
            },
        },
    );

    await Promise.all([
        User.syncIndexes(),
        Order.syncIndexes(),
        Log.syncIndexes(),
    ]);

    console.log(JSON.stringify({
        ts: new Date().toISOString(),
        action: 'BACKFILL_COMPLETE',
        orderDefaultsMatched: orderDefaultsResult.matchedCount,
        orderDefaultsModified: orderDefaultsResult.modifiedCount,
    }));

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore disconnect errors on failure path
    }
    process.exit(1);
});