import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { UpiConfig } from './upi-config';
import {
  authenticatedSender,
  decrypt,
  encrypt,
  fingerprint,
  normalizeUtr,
  parseSyntheticCredit,
  timestampMatches,
} from './upi-rules';
import { plainText } from './gmail-reconciliation.service';
export const syntheticAlert = (
  utr = '123456789012',
  amount = '1.00',
  beneficiary = 'niral-test@upi',
  at = new Date().toISOString(),
) =>
  `NIRAL SYNTHETIC CREDIT V1\nAmount: ${amount}\nUTR: ${utr}\nBeneficiary: ${beneficiary}\nDirection: CREDIT\nStatus: SUCCESS\nTimestamp: ${at}`;
export const trustedHeaders = [
  { name: 'From', value: 'Synthetic <alerts@example.test>' },
  {
    name: 'Authentication-Results',
    value:
      'mx.google.com; spf=pass; dkim=pass header.i=@example.test; dmarc=pass header.from=example.test',
  },
];
describe('Synthetic UPI parser and security rules (no real money)', () => {
  it('parses the explicit supported synthetic credit template', () =>
    expect(parseSyntheticCredit(syntheticAlert())?.amountMinor).toBe(100));
  it.each([
    syntheticAlert().replace('UTR: 123456789012\n', ''),
    syntheticAlert().replace('1.00', '1.001'),
    syntheticAlert().replace('CREDIT', 'DEBIT'),
    syntheticAlert().replace('Status: SUCCESS', 'Status: FAILED'),
    syntheticAlert() + '\nUTR: 123456789012',
    'Bank notification: you received money',
    syntheticAlert().replace('Timestamp:', 'Invalid:'),
  ])('rejects incomplete, debit, failed and ambiguous bodies %#', (body) =>
    expect(parseSyntheticCredit(body)).toBeNull(),
  );
  it('requires a trusted aligned sender, SPF, DKIM and DMARC', () => {
    expect(authenticatedSender(trustedHeaders, ['alerts@example.test'])).toBe(
      true,
    );
    expect(authenticatedSender(trustedHeaders, ['other@example.test'])).toBe(
      false,
    );
    expect(
      authenticatedSender(
        trustedHeaders.map((h) => ({
          ...h,
          value: h.value.replace('dkim=pass', 'dkim=fail'),
        })),
        ['alerts@example.test'],
      ),
    ).toBe(false);
    expect(
      authenticatedSender(
        [
          ...trustedHeaders.slice(0, 1),
          {
            name: 'Authentication-Results',
            value: 'attacker.test; spf=pass; dkim=pass; dmarc=pass',
          },
          trustedHeaders[1],
        ],
        ['alerts@example.test'],
      ),
    ).toBe(false);
  });
  it('normalizes references without fuzzy matching', () => {
    expect(normalizeUtr('1234-5678-9012')).toBe('123456789012');
    expect(() => normalizeUtr('abc')).toThrow();
  });
  it('rejects transaction times outside the order window', () => {
    const now = new Date(),
      expires = new Date(now.getTime() + 10000);
    expect(timestampMatches(now, now, expires)).toBe(true);
    expect(
      timestampMatches(new Date(now.getTime() - 600000), now, expires),
    ).toBe(false);
    expect(timestampMatches(new Date(now.getTime() + 1000), now, expires)).toBe(
      false,
    );
  });
  it('encrypts with authenticated encryption and keyed fingerprints', () => {
    const key = randomBytes(32),
      value = 'sensitive-test-value',
      encrypted = encrypt(value, key);
    expect(encrypted).not.toContain(value);
    expect(decrypt(encrypted, key)).toBe(value);
    expect(() => decrypt(encrypted, randomBytes(32))).toThrow();
    expect(fingerprint(value, key)).not.toBe(
      fingerprint(value, randomBytes(32)),
    );
  });
  it('does not merge ambiguous MIME alternatives or HTML into a synthetic alert', () => {
    const part = {
      mimeType: 'text/plain',
      body: { data: Buffer.from('fixture').toString('base64url') },
    };
    expect(plainText(part)).toBe('fixture');
    expect(plainText({ parts: [part, part] })).toBeNull();
    expect(
      plainText({ mimeType: 'text/html', body: { data: 'abc' } }),
    ).toBeNull();
  });
  it('blocks custom collection under production even when every test flag is true', () => {
    const config = new UpiConfig(
      new ConfigService({
        NODE_ENV: 'production',
        UPI_SYNTHETIC_MODE: 'true',
        MANUAL_UPI_ENABLED: 'true',
        FAMAPP_SANDBOX_ENABLED: 'true',
        FAMAPP_PERSONAL_TEST_AUTHORIZED: 'true',
      }),
    );
    expect(() => config.ensure('MANUAL_UPI')).toThrow();
    expect(() => config.ensure('FAMAPP_SANDBOX')).toThrow();
    expect(config.status().productionCollection).toBe(false);
  });
  it('requires explicit feature flags, allowlisted participants and personal-test authorization', () => {
    expect(() =>
      new UpiConfig(new ConfigService({})).ensure('MANUAL_UPI'),
    ).toThrow();
    const config = new UpiConfig(
      new ConfigService({
        NODE_ENV: 'development',
        UPI_SYNTHETIC_MODE: 'true',
        MANUAL_UPI_ENABLED: 'true',
        MANUAL_UPI_TEST_ID: 'niral-test@upi',
        UPI_RECONCILIATION_KEY: randomBytes(32).toString('base64'),
      }),
    );
    expect(() =>
      config.ensure('MANUAL_UPI', 'ordinary@example.test'),
    ).toThrow();
  });
});
