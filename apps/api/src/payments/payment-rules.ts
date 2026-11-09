import { BadRequestException, ConflictException } from '@nestjs/common';

export function money(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000)
    throw new BadRequestException(
      'Use an integer amount in minor currency units within the supported limit.',
    );
  return amount;
}
export function requireFeeScope(scope: string) {
  if (!['PARTICIPANT', 'TEAM'].includes(scope))
    throw new ConflictException('Choose participant or fixed team pricing.');
}
export function escapeHtml(value: unknown) {
  const text =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
      ? String(value)
      : '';
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
