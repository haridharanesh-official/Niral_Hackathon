import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'crypto';

export const UPI_PROVIDERS = ['MANUAL_UPI', 'FAMAPP_SANDBOX'] as const;
export type UpiProvider = (typeof UPI_PROVIDERS)[number];
export function normalizeUtr(value: string) {
  const result = value.replace(/[\s-]/g, '').toUpperCase();
  // Deliberately narrow supported format; never guess from ambiguous references.
  if (!/^\d{12}$/.test(result))
    throw new BadRequestException('Enter a supported 12-digit UPI reference.');
  return result;
}
export const mask = (value: string) => `••••${value.slice(-4)}`;
export function keyBytes(value: string | undefined) {
  const key = Buffer.from(value ?? '', 'base64');
  if (key.length !== 32)
    throw new ServiceUnavailableException(
      'Reconciliation encryption key is not configured.',
    );
  return key;
}
export function fingerprint(value: string, key: Buffer) {
  return createHmac('sha256', key).update(value).digest('hex');
}
export function encrypt(value: string, key: Buffer) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString(
    'base64',
  );
}
export function decrypt(value: string, key: Buffer) {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([
    decipher.update(data.subarray(12, -16)),
    decipher.final(),
  ]).toString('utf8');
}
export type CreditAlert = {
  amountMinor: number;
  utr: string;
  beneficiary: string;
  direction: 'CREDIT';
  status: 'SUCCESS';
  transactionAt: Date;
};
// This is an explicit SYNTHETIC template, never a guessed FamApp/bank adapter.
export function parseSyntheticCredit(body: string): CreditAlert | null {
  const lines = body.trim().replace(/\r/g, '').split('\n');
  if (lines.shift() !== 'NIRAL SYNTHETIC CREDIT V1' || lines.length !== 6)
    return null;
  const fields = new Map<string, string>();
  for (const line of lines) {
    const match = /^([A-Za-z]+): (\S+)$/.exec(line);
    if (!match || fields.has(match[1])) return null;
    fields.set(match[1], match[2]);
  }
  const amount = fields.get('Amount') ?? '';
  if (!/^\d{1,7}\.\d{2}$/.test(amount)) return null;
  const [rupees, paise] = amount.split('.');
  const amountMinor = Number(rupees) * 100 + Number(paise);
  const timestamp = fields.get('Timestamp') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp))
    return null;
  const transactionAt = new Date(timestamp),
    beneficiary = fields.get('Beneficiary')?.toLowerCase() ?? '';
  if (
    !Number.isFinite(transactionAt.getTime()) ||
    transactionAt.toISOString() !==
      (timestamp.includes('.') ? timestamp : timestamp.replace('Z', '.000Z')) ||
    amountMinor < 1 ||
    !/^[\w.-]{2,100}@[a-z0-9.-]{2,80}$/.test(beneficiary) ||
    fields.get('Direction') !== 'CREDIT' ||
    fields.get('Status') !== 'SUCCESS'
  )
    return null;
  try {
    return {
      amountMinor,
      utr: normalizeUtr(fields.get('UTR') ?? ''),
      beneficiary,
      direction: 'CREDIT',
      status: 'SUCCESS',
      transactionAt,
    };
  } catch {
    return null;
  }
}
export function timestampMatches(
  at: Date,
  createdAt: Date,
  expiresAt: Date | null,
  now = new Date(),
) {
  return (
    at.getTime() >= createdAt.getTime() - 300000 &&
    at <= now &&
    (!expiresAt || at <= expiresAt)
  );
}
export type GmailHeader = { name: string; value: string };
export function authenticatedSender(
  headers: GmailHeader[],
  allowed: string[],
): boolean {
  const from = headers.filter((h) => h.name.toLowerCase() === 'from');
  if (from.length !== 1) return false;
  const address = /^(?:[^<>]*<)?([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+)>?$/i
    .exec(from[0].value.trim())?.[1]
    ?.toLowerCase();
  if (!address || !allowed.includes(address)) return false;
  const domain = address.split('@')[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Trust only the first Gmail authentication result, not an embedded forwarded header.
  const auth =
    headers.find((h) => h.name.toLowerCase() === 'authentication-results')
      ?.value ?? '';
  return (
    /^mx\.google\.com;/.test(auth.trim()) &&
    /\bspf=pass\b/.test(auth) &&
    new RegExp(
      `\\bdkim=pass\\b[^;]*header\\.(?:i|d)=@?${domain}(?:[;\\s]|$)`,
      'i',
    ).test(auth) &&
    new RegExp(
      `\\bdmarc=pass\\b[^;]*header\\.from=${domain}(?:[;\\s]|$)`,
      'i',
    ).test(auth)
  );
}
