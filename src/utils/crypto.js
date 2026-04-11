import crypto from 'crypto';
import { JWT_SECRET } from '../config.js';

// ── Base64-URL helpers ────────────────────────────────────────────────────────
const b64uEncode = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/** Convert a base64url string back to a UTF-8 string. */
const b64uDecode = (str) => {
  // base64url → standard base64: swap - and _ back, re-add padding
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + (4 - (str.length % 4)) % 4,
    '=',
  );
  return Buffer.from(base64, 'base64').toString();
};

// ── JWT ───────────────────────────────────────────────────────────────────────

/**
 * Create a HS256 JWT.
 * @param {object} payload  Custom claims to embed.
 * @param {number} secs     Expiry in seconds from now (default: 7 days).
 */
export function jwtSign(payload, secs = 7 * 86_400) {
  const header  = b64uEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = b64uEncode(Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + secs,
  })));
  const sig = b64uEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${sig}`;
}

/**
 * Verify a HS256 JWT and return the payload, or null if invalid/expired.
 * @param {string} token
 * @returns {object|null}
 */
export function jwtVerify(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = b64uEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest(),
    );
    if (sig !== expected) return null;

    const payload = JSON.parse(b64uDecode(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Password hashing ──────────────────────────────────────────────────────────

/**
 * Hash a password with PBKDF2-SHA256 (100 000 iterations, 64-byte output).
 * Returns `"<hex-salt>:<hex-hash>"`.
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored `"salt:hash"` string.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

// ── Unique order ID ───────────────────────────────────────────────────────────

/** Generate a collision-resistant BC order ID. */
export function generateId() {
  return `BC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
