// Shape supplied by the owner. Template validation is not sender authentication.
export type FamAppCredit = {
  amountMinor: number;
  utr: string;
  transactionId: string;
  transactionAt: Date;
  balanceMinor: number;
  senderDisplayMasked: string;
  recipientDisplayMasked: string;
  direction: 'CREDIT';
  status: 'SUCCESS';
};
export function notificationText(body: string): string {
  if (body.length > 80000) return '';
  return body
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(?:td|th|tr|table|p|div|br|hr|h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(
      /&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos|rupee);/gi,
      (_all, entity: string) => {
        const key = entity.toLowerCase();
        const map: Record<string, string> = {
          nbsp: ' ',
          amp: '&',
          lt: '<',
          gt: '>',
          quot: '"',
          apos: "'",
          rupee: '₹',
        };
        if (key in map) return map[key];
        const code = key.startsWith('#x')
          ? parseInt(key.slice(2), 16)
          : parseInt(key.slice(1), 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      },
    )
    .normalize('NFKC')
    .replace(/[\s\u200b\ufeff]+/gu, ' ')
    .trim();
}
export function paise(value: string): number | null {
  if (
    !/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(
      value,
    )
  )
    return null;
  const [whole, decimal = ''] = value.replaceAll(',', '').split('.');
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(result) && result >= 0 && result <= 2147483647
    ? result
    : null;
}
export function istTimestamp(value: string): Date | null {
  const match =
    /^(\d{1,2}):(\d{2}) (AM|PM) IST, (\d{1,2}) ([A-Za-z]+) (\d{4})$/i.exec(
      value,
    );
  if (!match) return null;
  const month = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ].indexOf(match[5].toLowerCase());
  const hour = Number(match[1]),
    minute = Number(match[2]),
    day = Number(match[4]),
    year = Number(match[6]);
  if (
    hour < 1 ||
    hour > 12 ||
    minute > 59 ||
    month < 0 ||
    year < 2000 ||
    year > 2100
  )
    return null;
  const localHour = (hour % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const local = new Date(Date.UTC(year, month, day, localHour, minute));
  if (
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month ||
    local.getUTCDate() !== day
  )
    return null;
  return new Date(local.getTime() - 330 * 60000);
}
export function parseFamAppCredit(body: string): FamAppCredit | null {
  const text = notificationText(body);
  const match =
    /^Hey (.{1,160}?), You have successfully received ₹\s*([\d,.]+) from (.{1,160}?) Transaction ID\s*:\s*([a-z0-9_-]{4,100}) Date\s*:\s*(\d{1,2}:\d{2} [AP]M IST, \d{1,2} [A-Za-z]+ \d{4}) Updated Balance\s*:\s*₹\s*([\d,.]+) UTR\s*:\s*(\d{12}) Best, Fam\.?$/i.exec(
      text,
    );
  if (!match) return null;
  const amountMinor = paise(match[2]),
    balanceMinor = paise(match[6]),
    transactionAt = istTimestamp(match[5]);
  if (
    amountMinor === null ||
    amountMinor < 1 ||
    balanceMinor === null ||
    !transactionAt
  )
    return null;
  return {
    amountMinor,
    balanceMinor,
    transactionAt,
    transactionId: match[4],
    utr: match[7],
    senderDisplayMasked: `${match[3].slice(0, 1)}•••`,
    recipientDisplayMasked: `${match[1].slice(0, 1)}•••`,
    direction: 'CREDIT',
    status: 'SUCCESS',
  };
}
type MimePart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: MimePart[];
};
// Accept equivalent text/html alternatives once; quarantine conflicting content.
export function creditBody(part: MimePart): string {
  const variants: string[] = [];
  function walk(value: MimePart, depth: number) {
    if (depth > 10 || value.filename || variants.length > 4) return;
    if (
      ['text/plain', 'text/html'].includes(value.mimeType ?? '') &&
      value.body?.data &&
      (value.body.size ?? 0) <= 80000
    )
      variants.push(
        Buffer.from(value.body.data, 'base64url')
          .toString('utf8')
          .slice(0, 80000),
      );
    for (const child of value.parts ?? []) walk(child, depth + 1);
  }
  walk(part, 0);
  if (!variants.length || variants.length > 4) return '';
  const canonical = variants.map((text) => {
    const parsed = parseFamAppCredit(text);
    return parsed ? JSON.stringify(parsed) : notificationText(text);
  });
  return canonical.every((value) => value === canonical[0]) ? variants[0] : '';
}
