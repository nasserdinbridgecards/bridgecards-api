import crypto from 'crypto';
import { SENDGRID_KEY, FROM_EMAIL, ADMIN_EMAIL } from '../config.js';
import { log } from '../utils/logger.js';
import { dbSetOrder } from '../db/index.js';

// ── HTML helpers ──────────────────────────────────────────────────────────────

/**
 * Escape a string for safe inclusion in HTML content.
 * Prevents XSS when user-controlled data is embedded in email templates.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── HTML email template ───────────────────────────────────────────────────────

/**
 * Render a minimal branded HTML email.
 *
 * @param {string} title  Heading shown in the card.
 * @param {string} body   HTML content for the body section.
 * @param {string} col    Accent colour (default: BridgeCards blue).
 */
export function emailTemplate(title, body, col = '#3d6bff') {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #07080f; color: #eef0ff; margin: 0; padding: 20px; }
  .c   { background: #111220; border-radius: 16px; max-width: 560px; margin: 0 auto; padding: 32px; }
  h2   { font-size: 17px; font-weight: 800; color: ${col}; }
  .r   { display: flex; justify-content: space-between; padding: 6px 0;
         border-bottom: 1px solid #252740; font-size: 13px; }
  .r:last-child { border: none; font-weight: 800; color: #00d4aa; }
  .cb  { background: #0d0e1a; border: 2px dashed ${col}; border-radius: 10px;
         padding: 14px; text-align: center; font-family: monospace; font-size: 20px;
         font-weight: 900; letter-spacing: 4px; color: #00d4aa; margin: 14px 0; }
  .ft  { text-align: center; font-size: 11px; color: #9294b8; margin-top: 18px; }
</style>
</head>
<body><div class="c">
  <div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:20px;">
    🌉 <span style="color:${col}">BridgeCards</span>
  </div>
  <h2>${title}</h2>
  ${body}
  <div class="ft">
    BridgeCards · Zetony LLC (USA) ·
    <a href="mailto:${ADMIN_EMAIL}" style="color:#00d4aa">${ADMIN_EMAIL}</a>
  </div>
</div></body></html>`;
}

// ── SendGrid delivery ─────────────────────────────────────────────────────────

/**
 * Send a transactional email via SendGrid.
 * Silently skips when SENDGRID_KEY is not configured (dev mode).
 *
 * @returns {Promise<boolean>}  true when the API accepted the message (HTTP 202).
 */
export async function sendEmail({ to, subject, html }) {
  if (!SENDGRID_KEY) {
    log('WARN', 'EMAIL_SKIP', { to, subject });
    return false;
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from:    { email: FROM_EMAIL, name: 'BridgeCards' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    log(res.status === 202 ? 'INFO' : 'ERROR', 'EMAIL', { to, status: res.status });
    return res.status === 202;
  } catch (err) {
    log('ERROR', 'EMAIL_ERR', { error: err.message });
    return false;
  }
}

// ── Invoice ───────────────────────────────────────────────────────────────────

/** Derive a human-readable invoice number from an order ID and the current date. */
export function generateInvoiceNo(orderId) {
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const tail      = orderId.split('-').slice(-1)[0]
    || crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INV-${yearMonth}-${tail}`;
}

/** Render invoice HTML for an order. */
export function invoiceHtml(order) {
  const issued = order.invoiceIssuedAt || new Date().toISOString();
  return emailTemplate('🧾 Invoice / فاتورة', `
    <div class="r"><span>Invoice</span><span>${escapeHtml(order.invoiceNo)}</span></div>
    <div class="r"><span>Issued</span><span>${escapeHtml(new Date(issued).toLocaleString('en-US'))}</span></div>
    <div class="r"><span>Order</span><span>${escapeHtml(order.id)}</span></div>
    <div class="r"><span>Email</span><span>${escapeHtml(order.email)}</span></div>
    <div class="r"><span>Product</span><span>${escapeHtml(order.productName)}</span></div>
    <div class="r"><span>Qty</span><span>${escapeHtml(String(order.quantity))}</span></div>
    <div class="r"><span>Unit</span><span>$${order.unitPrice.toFixed(2)}</span></div>
    <div class="r"><span>Total</span><span>$${order.totalAmount.toFixed(2)}</span></div>
    <p style="font-size:12px;color:#9294b8;margin-top:10px;">
      For accounting support, reply to this email.
    </p>`);
}

/**
 * Attach an invoice number to an order and email the invoice to the customer.
 * Idempotent — does nothing if the order already has an invoice number.
 *
 * @param {object} order  Mutable order object (updated in place + persisted).
 * @returns {object}      The (potentially updated) order.
 */
export async function issueInvoice(order) {
  if (order.invoiceNo) return order;
  order.invoiceNo       = generateInvoiceNo(order.id);
  order.invoiceIssuedAt = new Date().toISOString();
  await dbSetOrder(order.id, order);
  await sendEmail({
    to:      order.email,
    subject: `🧾 Invoice ${order.invoiceNo} — BridgeCards`,
    html:    invoiceHtml(order),
  });
  log('INFO', 'INVOICE_SENT', {
    orderId:   order.id,
    invoiceNo: order.invoiceNo,
    to:        order.email,
  });
  return order;
}
