import 'dotenv/config';

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const RELOADLY_ID = process.env.RELOADLY_CLIENT_ID || '';
export const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET || '';
export const SANDBOX = process.env.RELOADLY_SANDBOX === 'true';
export const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_PUB = process.env.STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET || '';
export const SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bridgecards.org';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@bridgecards.org';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
export const FX_API_KEY = process.env.FX_API_KEY || '';
export const MIN_MARGIN = parseFloat(process.env.MIN_PROFIT_MARGIN || '0.12');
export const MONGODB_URI = process.env.MONGODB_URI || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
export const PORT = parseInt(process.env.PORT || '3000', 10);

export const STRIPE_FEE_PCT = 0.029;
export const STRIPE_FEE_FLAT = 0.30;

export const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';

function requireEnvs(names, missing) {
  for (const name of names) {
    if (!process.env[name]?.trim()) missing.push(name);
  }
}

export function validateRuntimeConfig() {
  const missing = [];

  requireEnvs(['MONGODB_URI', 'JWT_SECRET', 'ADMIN_PASSWORD'], missing);

  const stripeConfigured = [STRIPE_SECRET, STRIPE_PUB, STRIPE_WEBHOOK].some(Boolean);
  const reloadlyConfigured = [RELOADLY_ID, RELOADLY_SECRET].some(Boolean);
  const productionLike = NODE_ENV === 'production';

  if (productionLike || stripeConfigured) {
    requireEnvs([
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ], missing);
  }

  if (productionLike || reloadlyConfigured) {
    requireEnvs(['RELOADLY_CLIENT_ID', 'RELOADLY_CLIENT_SECRET'], missing);
  }

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT || 'undefined'}`);
  }
  if (Number.isNaN(MIN_MARGIN) || MIN_MARGIN < 0) {
    throw new Error('MIN_PROFIT_MARGIN must be a valid non-negative number');
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${[...new Set(missing)].join(', ')}`);
  }
}
