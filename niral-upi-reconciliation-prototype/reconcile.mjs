// NIRAL proof-of-concept: local synthetic reconciliation only.
// No Gmail access, wallet access, database writes or production confirmations.

export const normalizeUtr = value => String(value ?? '').replace(/[\s-]/g, '');

export function toPaise(value) {
  const text = String(value).replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [rupees, paise = ''] = text.split('.');
  const result = Number(rupees) * 100 + Number((paise + '00').slice(0, 2));
  return Number.isSafeInteger(result) ? result : null;
}

export function parseExampleAlert(message) {
  // Synthetic template only: replace with a parser validated against your own
  // redacted, confirmed email format; do not trust sender address alone.
  const body = String(message.body ?? '');
  const amount = body.match(/^Amount:\s*(?:INR\s*|Rs\.?\s*|₹\s*)?([\d,]+(?:\.\d{1,2})?)\s*$/im);
  const utr = body.match(/^(?:UTR|UPI Reference):\s*([0-9]{12})\s*$/im);
  const payee = body.match(/^Payee:\s*(\S+)\s*$/im);
  const status = body.match(/^Status:\s*(Credited|Received)\s*$/im);
  if (!amount || !utr || !payee || !status) return null;
  const amountPaise = toPaise(amount[1]);
  if (amountPaise === null) return null;
  return {
    messageId: message.id,
    from: String(message.from ?? '').toLowerCase(),
    amountPaise,
    utr: utr[1],
    payee: payee[1].toLowerCase(),
    status: status[1].toUpperCase(),
  };
}

export function reconcile({ order, claim, messages, officialCredits = [], usedUtrs = [], expectedSender }) {
  // Assume all inputs are exclusively local simulated fixture data.
  // In production order/payee/amount MUST be server-sourced, and official
  // credits MUST come from independently verified receiving-account records.
  const utr = normalizeUtr(claim?.utr);
  if (!/^\d{12}$/.test(utr)) return { status: 'NEEDS_REVIEW', reason: 'Missing/invalid UTR' };
  if (usedUtrs.includes(utr)) return { status: 'REJECTED_DUPLICATE', reason: 'UTR already allocated' };
  if (claim?.orderId !== order.id) return { status: 'NEEDS_REVIEW', reason: 'Order mismatch' };

  const candidates = messages
    .filter(m => String(m.from).toLowerCase() === expectedSender.toLowerCase())
    .map(parseExampleAlert)
    .filter(Boolean)
    .filter(a => a.utr === utr);
  if (candidates.length === 0) return { status: 'PENDING_ALERT', reason: 'No matching email candidate' };
  if (candidates.some(a => a.amountPaise !== order.amountPaise || a.payee !== order.payee.toLowerCase())) {
    return { status: 'NEEDS_REVIEW', reason: 'Alert amount/payee mismatch' };
  }

  // Email is only an advisory signal, never settlement proof.
  const credit = officialCredits.find(c =>
    c.utr === utr && c.amountPaise === order.amountPaise &&
    c.payee.toLowerCase() === order.payee.toLowerCase() && c.recordType === 'RECEIVING_ACCOUNT_CREDIT'
  );
  if (!credit) return { status: 'ALERT_MATCHED_PENDING_CREDIT', reason: 'Email candidate matched; actual incoming credit not confirmed' };
  return { status: 'SIMULATED_VERIFIED', reason: 'Synthetic independent credit record matched; NOT a real payment confirmation' };
}
