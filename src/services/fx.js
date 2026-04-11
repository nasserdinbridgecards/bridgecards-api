import { fetchWithTimeout } from '../utils/fetch.js';
import { log } from '../utils/logger.js';
import { FX_API_KEY } from '../config.js';
import { settings } from '../store.js';

// ── Fallback rates (USD base) ─────────────────────────────────────────────────
export const FALLBACK_FX = {
  USD: 1,   EUR: 1.12, GBP: 1.32, CAD: 0.76,
  AUD: 0.68, NOK: 0.097, SEK: 0.096, TRY: 0.031,
  AED: 0.272, SAR: 0.267, KWD: 3.27, EGP: 0.021, MAD: 0.099,
};

let fxCache = { rates: { ...FALLBACK_FX }, updatedAt: 0 };

/**
 * Return live USD-denominated rates for the currencies BridgeCards supports.
 * Refreshes from the exchange-rate API at most once per hour; uses fallback
 * rates on failure.
 */
export async function getLiveFX() {
  if (Date.now() - fxCache.updatedAt < 60 * 60_000) return fxCache.rates;

  try {
    const url = FX_API_KEY
      ? `https://v6.exchangerate-api.com/v6/${FX_API_KEY}/latest/USD`
      : 'https://open.er-api.com/v6/latest/USD';

    const res  = await fetchWithTimeout(url, {}, 8_000);
    const data = await res.json();
    const raw  = data.conversion_rates || data.rates;

    if (raw) {
      const buf   = 1 + settings.fxBuffer;
      const rates = {};
      for (const currency of Object.keys(FALLBACK_FX)) {
        rates[currency] = currency === 'USD'
          ? 1
          : raw[currency]
            ? (1 / raw[currency]) * buf
            : FALLBACK_FX[currency];
      }
      fxCache = { rates, updatedAt: Date.now() };
      log('INFO', 'FX_UPDATED');
    }
  } catch (err) {
    log('WARN', 'FX_FAILED', { error: err.message });
  }

  return fxCache.rates;
}

/** Expose the raw cache metadata (for admin stats / public endpoint). */
export function getFxCacheInfo() {
  return { rates: fxCache.rates, updatedAt: fxCache.updatedAt };
}

// Warm up on module load; refresh every hour.
getLiveFX().catch(() => {});
setInterval(() => getLiveFX().catch(() => {}), 60 * 60_000);
