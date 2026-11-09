import { money, requireFeeScope, escapeHtml } from './payment-rules';
describe('Provider-independent payment rules', () => {
  it.each([NaN, Infinity, -1, 1.2, 100000001])(
    'rejects unsafe currency minor units %s',
    (value) => expect(() => money(value)).toThrow(),
  );
  it('accepts integer paise without rounding', () =>
    expect(money(100)).toBe(100));
  it('rejects unknown pricing scopes', () =>
    expect(() => requireFeeScope('UNKNOWN')).toThrow());
  it('escapes financial receipt text', () =>
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;'));
});
