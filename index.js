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

// ================== TOKEN ==================
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

// ================== HEALTH ==================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sandbox: SANDBOX });
});

// ================== STRIPE KEY ==================
app.get('/api/stripe-key', (req, res) => {
  res.json({ publishableKey: STRIPE_PUB });
});

// ================== CREATE PAYMENT ==================
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', email } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

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

// ================== ORDER ==================
app.post('/api/order', async (req, res) => {
  try {
    const { productId, quantity, recipientEmail, paymentIntentId } = req.body;

    if (!productId || !quantity || !recipientEmail) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const numericProductId = parseInt(productId);
    if (isNaN(numericProductId)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    // ✅ تحقق من الدفع
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

    // ✅ جلب المنتج من Reloadly
    const productRes = await fetch(`${RL_BASE}/products/${numericProductId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });

    const pd = await productRes.json();

    let countryCode = pd.countryCode || pd.country?.isoName || 'US';

    let finalUnitPrice = null;

    // ✅ نأخذ السعر فقط من Reloadly (بدون أي تعديل)
    if (pd.fixedRecipientDenominations?.length) {
      finalUnitPrice = pd.fixedRecipientDenominations[0];
    } else if (pd.fixedSenderDenominations?.length) {
      finalUnitPrice = pd.fixedSenderDenominations[0];
    } else {
      return res.status(400).json({
        error: 'هذا المنتج لا يحتوي على أسعار ثابتة'
      });
    }

    const payload = {
      productId: numericProductId,
      countryCode,
      quantity: parseInt(quantity),
      unitPrice: Number(finalUnitPrice),
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

    res.json(order);

  } catch (e) {
    console.log('ORDER ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ================== PRODUCTS ==================
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

// ================== SERVER ==================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
