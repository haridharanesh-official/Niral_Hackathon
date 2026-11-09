import { authenticatedSender } from './upi-rules';
import {
  creditBody,
  istTimestamp,
  paise,
  parseFamAppCredit,
} from './famapp-parser';
const text = `Hey Test Recipient,

You have successfully received

₹1.0

from Test Sender

Transaction ID : FAM_SYNTH_001
Date : 12:31 PM IST, 27 October 2026
Updated Balance : ₹999.00
UTR : 001234567890

Best, Fam.`;
const html = `<html><body><p>Hey <b>Test Recipient</b>,</p><table><tr><td>You have successfully received</td></tr><tr><td>&#x20B9;1.0</td></tr><tr><td>from Test Sender</td></tr><tr><td>Transaction ID :</td><td>FAM_SYNTH_001</td></tr><tr><td>Date :</td><td>12:31 PM IST, 27 October 2026</td></tr><tr><td>Updated Balance :</td><td>&#8377;999.00</td></tr><tr><td>UTR :</td><td>001234567890</td></tr></table><p>Best, Fam.</p></body></html>`;
const part = (mimeType: string, body: string) => ({
  mimeType,
  body: { data: Buffer.from(body).toString('base64url') },
});
describe('User-supplied FamApp credit template (redacted synthetic references; not a live email)', () => {
  it('parses amount independently of wallet balance and masks names', () => {
    const result = parseFamAppCredit(text)!;
    expect(result.amountMinor).toBe(100);
    expect(result.balanceMinor).toBe(99900);
    expect(result.utr).toBe('001234567890');
    expect(result.transactionId).toBe('FAM_SYNTH_001');
    expect(result.direction).toBe('CREDIT');
    expect(result.transactionAt.toISOString()).toBe('2026-10-27T07:01:00.000Z');
    expect(JSON.stringify(result)).not.toContain('Test Sender');
    expect(JSON.stringify(result)).not.toContain('Test Recipient');
  });
  it('supports HTML tables, rupee entities and ordinary text equivalently', () =>
    expect(parseFamAppCredit(html)).toEqual(parseFamAppCredit(text)));
  it.each(['1', '1.0', '1.00'])(
    'converts received ₹%s to integer paise',
    (amount) =>
      expect(
        parseFamAppCredit(text.replace('₹1.0', `₹${amount}`))?.amountMinor,
      ).toBe(100),
  );
  it('normalizes Unicode spaces and fullwidth digits without numeric UTR coercion', () =>
    expect(
      parseFamAppCredit(
        text.replaceAll(' ', '\u00a0').replace('₹1.0', '₹１.０'),
      )?.utr,
    ).toBe('001234567890'));
  it('does not mistake updated balance for the received amount', () =>
    expect(parseFamAppCredit(text.replace('₹1.0', '₹2.0'))?.amountMinor).toBe(
      200,
    ));
  it.each([
    text.replace('UTR : 001234567890', ''),
    text.replace('001234567890', '123'),
    text.replace('received', 'paid'),
    text.replace('received', 'failed to receive'),
    text.replace('Transaction ID : FAM_SYNTH_001', ''),
    text.replace('₹1.0', '₹1.001'),
    text + '\nAnother payment received',
    text.replace('27 October', '31 February'),
    text.replace('IST', 'UTC'),
    text.replace('received', 'debited'),
  ])('quarantines incomplete/debit/failed/unknown templates %#', (body) =>
    expect(parseFamAppCredit(body)).toBeNull(),
  );
  it('handles midnight/noon IST and rejects invalid dates', () => {
    expect(istTimestamp('12:00 AM IST, 1 January 2026')?.toISOString()).toBe(
      '2025-12-31T18:30:00.000Z',
    );
    expect(istTimestamp('12:00 PM IST, 1 January 2026')?.toISOString()).toBe(
      '2026-01-01T06:30:00.000Z',
    );
    expect(istTimestamp('13:00 PM IST, 1 January 2026')).toBeNull();
  });
  it('accepts equivalent MIME alternatives once and rejects conflicting amounts', () => {
    expect(
      parseFamAppCredit(
        creditBody({
          parts: [part('text/plain', text), part('text/html', html)],
        }),
      )?.amountMinor,
    ).toBe(100);
    expect(
      creditBody({
        parts: [
          part('text/plain', text),
          part('text/html', html.replace('1.0', '2.0')),
        ],
      }),
    ).toBe('');
    expect(
      creditBody({
        ...part('text/plain', text),
        filename: 'untrusted-attachment.txt',
      }),
    ).toBe('');
  });
  it('does not authenticate a displayed sender without aligned Gmail results', () => {
    const from = { name: 'From', value: 'no-reply@famapp.in' };
    expect(authenticatedSender([from], ['no-reply@famapp.in'])).toBe(false);
    const pass = {
      name: 'Authentication-Results',
      value:
        'mx.google.com; spf=pass; dkim=pass header.i=@famapp.in; dmarc=pass header.from=famapp.in',
    };
    expect(authenticatedSender([from, pass], [])).toBe(false);
    expect(
      authenticatedSender(
        [from, { ...pass, value: pass.value.replace('spf=pass', 'spf=fail') }],
        ['no-reply@famapp.in'],
      ),
    ).toBe(false);
    expect(authenticatedSender([from, pass], ['no-reply@famapp.in'])).toBe(
      true,
    );
  });
  it('validates decimals and grouping without floating point rounding', () => {
    expect(paise('1,234.5')).toBe(123450);
    expect(paise('12,34')).toBeNull();
    expect(paise('-1')).toBeNull();
  });
});
