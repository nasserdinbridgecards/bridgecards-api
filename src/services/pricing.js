import { STRIPE_FEE_PCT, STRIPE_FEE_FLAT } from '../config.js';
import { settings } from '../store.js';

/**
 * Core pricing formula.
 *
 * Calculates the gross amount to charge so that after Stripe's cut
 * the business retains exactly (cost × (1 + margin)):
 *
 *   gross = (desiredNet + FLAT_FEE) / (1 - PCT_FEE)
 *
 * @param {number} costUSD       Reloadly cost in USD.
 * @param {number|null} marginOverride  Per-product margin override (null = global).
 * @returns {{ cost, margin, sell, profit, stripeFee }}
 */
export function calcPrice(costUSD, marginOverride = null) {
  const margin     = marginOverride ?? settings.globalMargin;
  const desiredNet = costUSD * (1 + margin);
  const gross      = (desiredNet + STRIPE_FEE_FLAT) / (1 - STRIPE_FEE_PCT);

  // Enforce a floor of cost + $0.60 so the business never loses money on tiny cards.
  const sell       = Math.max(parseFloat(gross.toFixed(2)), costUSD + 0.60);

  return {
    cost:      parseFloat(costUSD.toFixed(4)),
    margin,
    sell,
    profit:    parseFloat((sell * (1 - STRIPE_FEE_PCT) - STRIPE_FEE_FLAT - costUSD).toFixed(2)),
    stripeFee: parseFloat((sell * STRIPE_FEE_PCT + STRIPE_FEE_FLAT).toFixed(2)),
  };
}
