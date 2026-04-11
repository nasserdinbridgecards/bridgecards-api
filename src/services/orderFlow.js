import { generateId } from '../utils/crypto.js';
import { getLiveFX, FALLBACK_FX } from './fx.js';
import { calcPrice } from './pricing.js';
import { fetchProduct } from './reloadly.js';
import { productConfigs } from '../store.js';

export async function buildOrderDraft({
    orderId = generateId(),
    customerEmail,
    userId = null,
    productId,
    quantity,
    paymentMethod = 'card',
    paymentIntentId = null,
    unitPriceHint = null,
}) {
    const normalizedProductId = String(productId || '').trim();
    const normalizedQuantity = parseInt(quantity, 10);
    if (!customerEmail) throw new Error('Authentication required');
    if (!normalizedProductId || !normalizedQuantity || normalizedQuantity < 1) {
        throw new Error('Missing fields');
    }

    const numId = parseInt(normalizedProductId, 10);
    let productName = normalizedProductId;
    let serverUnitPrice = null;

    if (!isNaN(numId)) {
        const pd = await fetchProduct(numId);
        if (!pd) throw new Error('Product not found or not active');

        productName = pd.productName || normalizedProductId;

        const currency = pd.fixedSenderCurrencyCode || pd.senderCurrencyCode || 'USD';
        const discount = pd.discountPercentage || 0;
        const denoms = pd.fixedSenderDenominations || pd.fixedRecipientDenominations || [];
        const rates = await getLiveFX();
        const rateToUSD = rates[currency] ?? FALLBACK_FX[currency] ?? 1;
        const margin = productConfigs.get(String(numId))?.margin ?? null;
        const numericHint = unitPriceHint == null ? null : parseFloat(unitPriceHint);
        const matched = (numericHint && numericHint > 0
            ? denoms.find((d) => Math.abs(d - numericHint) < numericHint * 0.1)
            : null) ?? denoms[0];
        if (!matched) throw new Error('No valid denomination found');

        const costUSD = matched * (1 - discount / 100) * rateToUSD;
        serverUnitPrice = calcPrice(costUSD, margin).sell;
    } else {
        serverUnitPrice = parseFloat(unitPriceHint || 0);
        if (!(serverUnitPrice > 0)) throw new Error('Invalid price');
    }

    const totalAmount = parseFloat((serverUnitPrice * normalizedQuantity).toFixed(2));
    const now = new Date().toISOString();

    return {
        id: orderId,
        userId,
        email: customerEmail,
        productId: normalizedProductId,
        productName,
        quantity: normalizedQuantity,
        unitPrice: serverUnitPrice,
        totalAmount,
        paymentMethod,
        paymentIntentId,
        status: 'pending_payment',
        codes: [],
        reloadlyOrderId: null,
        createdAt: now,
        updatedAt: now,
        error: null,
        adminNotes: null,
    };
}