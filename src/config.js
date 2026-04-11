import 'dotenv/config';
import crypto from 'crypto';

export const RELOADLY_ID     = process.env.RELOADLY_CLIENT_ID     || '';
export const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET || '';
export const SANDBOX         = process.env.RELOADLY_SANDBOX === 'true';
export const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY      || '';
export const STRIPE_PUB      = process.env.STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_WEBHOOK  = process.env.STRIPE_WEBHOOK_SECRET  || '';
export const SENDGRID_KEY    = process.env.SENDGRID_API_KEY       || '';
export const FROM_EMAIL      = process.env.FROM_EMAIL    || 'noreply@bridgecards.org';
export const ADMIN_EMAIL     = process.env.ADMIN_EMAIL   || 'support@bridgecards.org';
export const FX_API_KEY      = process.env.FX_API_KEY    || '';
export const MIN_MARGIN      = parseFloat(process.env.MIN_PROFIT_MARGIN || '0.12');
export const MONGODB_URI     = process.env.MONGODB_URI   || '';
export const PORT            = parseInt(process.env.PORT || '3000', 10);

// JWT_SECRET: in production this MUST be a stable env var so sessions survive restarts.
// If omitted the server generates a random secret and logs a warning.
export const JWT_SECRET = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const generated = crypto.randomBytes(32).toString('hex');
  console.warn(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'WARN',
    action: 'JWT_SECRET_MISSING',
    msg: 'JWT_SECRET not set — using a random secret. All sessions will be invalidated on restart.',
  }));
  return generated;
})();

export const STRIPE_FEE_PCT  = 0.029;
export const STRIPE_FEE_FLAT = 0.30;

export const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';
