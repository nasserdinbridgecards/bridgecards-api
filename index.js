import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const RELOADLY_ID     = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const SANDBOX         = process.env.RELOADLY_SANDBOX === 'true';
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUB      = process.env.STRIPE_PUBLISHABLE_KEY;

const RL_BASE = SANDBOX
  ? 'https://giftcards-sandbox.reloadly.com'
  : 'https://giftcards.reloadly.com';

async function getToken() {
  const res = await fetch('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: RELOADLY_ID,
      client_secret: RELOADLY_SECRET,
      grant_type: 'client_credentials',
      audience: SANDBOX
        ? 'https://giftcards-sandbox.reloadly.com'
        : 'https://giftcards.reloadly.com',
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error('Reloadly auth failed: ' + JSON.stringify(d));
  return d.access_token;
}

// Stripe Refund
async function refundStripe(paymentIntentId, reason) {
  try {
    console.log('Refunding payment:', paymentIntentId, '| Reason:', reason);
    const body = new URLSearchParams({
      payment_intent: paymentIntentId,
      reason: 'other',
    });
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const refund = await res.json();
    console.log('Refund result:', JSON.stringify(refund));
    return refund;
  } catch (e) {
    console.error('Refund failed:', e.message);
    return null;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sandbox: SANDBOX });
});

app.get('/api/stripe-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUB });
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', email } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    // تحقق من رصيد Reloadly أولاً
    try {
      const token = await getToken();
      const balRes = await fetch(`${RL_BASE}/accounts/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
        },
      });
      const bal = await balRes.json();
      console.log('Reloadly balance:', JSON.stringify(bal));
      const balance = bal.balance || bal.currencyBalance || 0;
      if (!SANDBOX && balance < amount) {
        return res.status(503).json({ 
          error: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.' 
        });
      }
    } catch (e) {
      console.log('Balance check failed:', e.message);
    }

    const body = new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency,
      'payment_method_types[]': 'card',
      'metadata[customer_email]': email || '',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const pi = await response.json();
    if (pi.error) throw new Error(pi.error.message);
    res.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const { productId, quantity, unitPrice, recipientEmail, paymentIntentId } = req.body;

    console.log('ORDER REQUEST:', { productId, quantity, unitPrice, recipientEmail });

    const numericProductId = parseInt(productId);
    if (isNaN(numericProductId)) {
      // Refund إذا كان هناك دفع
      if (paymentIntentId) await refundStripe(paymentIntentId, 'product not available');
      return res.status(400).json({
        error: `المنتج غير متوفر في Reloadly حالياً.`,
        refunded: !!paymentIntentId,
      });
    }

    if (!quantity || !unitPrice || !recipientEmail) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // تحقق من Stripe
    if (paymentIntentId) {
      const piRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
      );
      const pi = await piRes.json();
      if (pi.status !== 'succeeded') {
        return res.status(402).json({ error: 'Payment not confirmed' });
      }
    }

    const token = await getToken();

    let finalUnitPrice = parseFloat(unitPrice);
    let countryCode = 'US';

    try {
      const productRes = await fetch(`${RL_BASE}/products/${numericProductId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
        },
      });
      const pd = await productRes.json();
      console.log('Product:', JSON.stringify(pd).slice(0, 400));

      if (pd.countryCode) countryCode = pd.countryCode;
      else if (pd.country?.isoName) countryCode = pd.country.isoName;

      const requested = parseFloat(unitPrice);
      if (pd.fixedRecipientDenominations?.length) {
        const match = pd.fixedRecipientDenominations.find(d => Math.abs(d - requested) < 2);
        finalUnitPrice = match !== undefined ? match : pd.fixedRecipientDenominations[0];
      } else if (pd.fixedSenderDenominations?.length) {
        const match = pd.fixedSenderDenominations.find(d => Math.abs(d - requested) < 2);
        finalUnitPrice = match !== undefined ? match : pd.fixedSenderDenominations[0];
      }
    } catch (e) {
      console.log('Product fetch error:', e.message);
    }

    const payload = {
      productId: numericProductId,
      countryCode,
      quantity: parseInt(quantity),
      unitPrice: finalUnitPrice,
      customIdentifier: `bc-${Date.now()}`,
      senderName: 'BridgeCards',
      recipientEmail,
    };

    console.log('SENDING TO RELOADLY:', JSON.stringify(payload));

    const orderRes = await fetch(`${RL_BASE}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const order = await orderRes.json();
    console.log('RELOADLY RESPONSE:', JSON.stringify(order));

    // إذا فشل الطلب → Refund تلقائي
    if (order.errorCode || order.status === 'FAILED' || order.message) {
      console.log('Order failed, initiating refund...');
      let refundDone = false;
      if (paymentIntentId) {
        const refund = await refundStripe(paymentIntentId, order.errorCode || 'order_failed');
        refundDone = refund?.status === 'succeeded';
      }
      return res.status(400).json({
        error: order.message || 'فشل الطلب',
        errorCode: order.errorCode,
        refunded: refundDone,
        refundMessage: refundDone 
          ? '✅ تم استرداد المبلغ تلقائياً إلى بطاقتك خلال 5-10 أيام عمل'
          : '⚠️ يرجى التواصل معنا لاسترداد المبلغ',
      });
    }

    res.json(order);
  } catch (e) {
    console.log('ORDER ERROR:', e.message);
    // Refund في حالة خطأ غير متوقع
    if (req.body.paymentIntentId) {
      await refundStripe(req.body.paymentIntentId, 'server_error');
    }
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const token = await getToken();
    const response = await fetch(`${RL_BASE}/products?size=200`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    res.json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
