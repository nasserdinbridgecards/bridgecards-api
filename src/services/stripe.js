import { STRIPE_SECRET } from '../config.js';
import { log } from '../utils/logger.js';

/**
 * Retrieve a Stripe PaymentIntent.
 * Returns the PaymentIntent object or null when Stripe is not configured.
 */
export async function getPaymentIntent(paymentIntentId) {
  if (!paymentIntentId || !STRIPE_SECRET) return null;
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
  });
  return res.json();
}

/**
 * Create a Stripe PaymentIntent.
 *
 * @param {{ amount: number, currency: string, email: string, productId: string, quantity: number }} params
 * @returns {{ clientSecret: string, id: string }}
 */
export async function createPaymentIntent({ amount, currency = 'usd', email, productId, quantity = 1 }) {
  const body = new URLSearchParams({
    amount:                          String(Math.round(amount * 100)),
    currency,
    'payment_method_types[]':        'card',
    'metadata[customer_email]':      email || '',
    'metadata[product_id]':          productId || '',
    'metadata[quantity]':            String(quantity),
  });
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const pi = await res.json();
  if (pi.error) throw new Error(pi.error.message);
  return { clientSecret: pi.client_secret, id: pi.id };
}

/**
 * Issue a Stripe refund for a PaymentIntent.
 * Returns the refund object, or null when Stripe is not configured / call fails.
 */
export async function stripeRefund(paymentIntentId, reason = 'other') {
  if (!paymentIntentId || !STRIPE_SECRET) return null;
  try {
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ payment_intent: paymentIntentId, reason }),
    });
    const refund = await res.json();
    log('INFO', 'REFUND', { status: refund.status, id: refund.id });
    return refund;
  } catch (err) {
    log('ERROR', 'REFUND_FAILED', { error: err.message });
    return null;
  }
}
