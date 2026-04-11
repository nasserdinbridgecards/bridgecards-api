import { RELOADLY_ID, RELOADLY_SECRET, SANDBOX, RL_BASE } from '../config.js';
import { log } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { getLiveFX, FALLBACK_FX } from './fx.js';
import { calcPrice } from './pricing.js';
import { productConfigs } from '../store.js';

// ── Token cache ───────────────────────────────────────────────────────────────
let _token     = null;
let _tokenExp  = 0;

/**
 * Return a valid Reloadly OAuth token, refreshing when it's about to expire.
 */
export async function getReloadlyToken() {
  if (_token && Date.now() < _tokenExp - 60_000) return _token;

  const res = await fetchWithTimeout('https://auth.reloadly.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      client_id:     RELOADLY_ID,
      client_secret: RELOADLY_SECRET,
      grant_type:    'client_credentials',
      audience:      SANDBOX
        ? 'https://giftcards-sandbox.reloadly.com'
        : 'https://giftcards.reloadly.com',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Reloadly auth failed');

  _token    = data.access_token;
  _tokenExp = Date.now() + (data.expires_in || 3_600) * 1_000;
  return _token;
}

/** Standard Accept header for all Reloadly gift-card API calls. */
const RL_ACCEPT = 'application/com.reloadly.giftcards-v1+json';

/**
 * Fetch a single Reloadly product.
 * Returns `null` when the product does not exist or is not ACTIVE.
 */
export async function fetchProduct(productId) {
  const token = await getReloadlyToken();
  const res   = await fetchWithTimeout(`${RL_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: RL_ACCEPT },
  });
  const pd = await res.json();
  if (!pd.productId || pd.status !== 'ACTIVE') return null;
  return pd;
}

/**
 * Calculate the server-side sell price for a Reloadly product.
 *
 * @param {number}      reloadlyId    Numeric Reloadly product ID.
 * @param {number|null} denomination  Requested denomination (null = return all).
 * @returns {object|null}
 */
export async function getServerPrice(reloadlyId, denomination = null) {
  try {
    const pd = await fetchProduct(reloadlyId);
    if (!pd) return null;

    const currency  = pd.fixedSenderCurrencyCode || pd.senderCurrencyCode || 'USD';
    const discount  = pd.discountPercentage || 0;
    const denoms    = pd.fixedSenderDenominations || pd.fixedRecipientDenominations || [];
    const rates     = await getLiveFX();
    const rateToUSD = rates[currency] ?? FALLBACK_FX[currency] ?? 1;
    const margin    = productConfigs.get(String(reloadlyId))?.margin ?? null;

    if (denomination !== null) {
      const matched = denoms.find((d) => Math.abs(d - denomination) < denomination * 0.1)
        ?? denoms[0];
      if (!matched) return null;
      const costUSD = matched * (1 - discount / 100) * rateToUSD;
      return { ...calcPrice(costUSD, margin), denomination: matched, currency, product: pd };
    }

    return {
      productId:     pd.productId,
      productName:   pd.productName,
      status:        pd.status,
      currency,
      discount,
      denominations: denoms.map((d) => {
        const costUSD = d * (1 - discount / 100) * rateToUSD;
        return { denomination: d, ...calcPrice(costUSD, margin) };
      }),
    };
  } catch (err) {
    log('WARN', 'SERVER_PRICE_FAILED', { reloadlyId, error: err.message });
    return null;
  }
}

/**
 * Place an order on Reloadly.
 *
 * @param {object} payload  Reloadly order payload.
 * @returns {object}        Reloadly response JSON.
 */
export async function placeReloadlyOrder(payload, token) {
  const authToken = token ?? await getReloadlyToken();
  const res = await fetchWithTimeout(`${RL_BASE}/orders`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${authToken}`,
      Accept:         RL_ACCEPT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
