import { MIN_MARGIN } from './config.js';

/**
 * Shared in-memory application state.
 *
 * In a multi-instance deployment these would be persisted to MongoDB.
 * For a single-instance deployment they survive in process memory.
 */

/** Runtime-adjustable settings controlled by admin. */
export const settings = {
  globalMargin:    MIN_MARGIN,
  fxBuffer:        0.03,
  allowedPayments: [
    'visa-card', 'paypal', 'crypto', 'vipps', 'swish',
    'bank', 'sadad', 'stcpay', 'fawry', 'cmi', 'apple-pay', 'gpay',
  ],
  maintenanceMode: false,
};

/** Per-product admin overrides (enabled / availability / margin). */
export const productConfigs = new Map();

/** Set of IP addresses that are currently blocked. */
export const blockedIPs = new Set();

/**
 * Recent-order deduplication map: `email:productId` → timestamp.
 * Prevents duplicate orders within a 30-second window.
 */
export const recentOrders = new Map();

/** Return true if this (email, productId) pair was seen in the last 30 s. */
export function isDuplicate(email, productId) {
  const key = `${email}:${productId}`;
  const now  = Date.now();
  const last = recentOrders.get(key);
  if (last && now - last < 30_000) return true;
  recentOrders.set(key, now);
  return false;
}
