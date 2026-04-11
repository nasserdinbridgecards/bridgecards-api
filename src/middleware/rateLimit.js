import { log } from '../utils/logger.js';
import { blockedIPs } from '../store.js';

// Map of IP → array of request timestamps within the current window.
const rateLimitMap = new Map();

// Purge stale entries every 5 minutes to prevent unbounded memory growth.
setInterval(() => {
  const cutoff = Date.now() - 300_000;
  for (const [ip, timestamps] of rateLimitMap) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, fresh);
    }
  }
}, 300_000);

/**
 * Express middleware factory: allow at most `maxRequests` calls per `windowMs`.
 * Blocked IPs are always rejected regardless of the rate.
 *
 * @param {number} maxRequests  Max allowed requests in the window (default: 10).
 * @param {number} windowMs     Rolling window in milliseconds (default: 60 000).
 */
export function rateLimit(maxRequests = 10, windowMs = 60_000) {
  return (req, res, next) => {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    if (blockedIPs.has(ip)) {
      log('WARN', 'BLOCKED_IP_REQ', { ip });
      return res.status(403).json({ error: 'Access denied' });
    }

    const now  = Date.now();
    const hits = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < windowMs);
    hits.push(now);
    rateLimitMap.set(ip, hits);

    if (hits.length > maxRequests) {
      log('WARN', 'RATE_LIMIT', { ip, count: hits.length });
      return res.status(429).json({ error: 'Too many requests — please wait.' });
    }

    return next();
  };
}
