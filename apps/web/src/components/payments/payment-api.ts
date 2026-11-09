export async function paymentRequest<T>(
  path: string,
  body?: unknown,
  method?: 'POST' | 'PATCH',
): Promise<T> {
  const response = await fetch(`/api/payments/${path}`, {
    cache: 'no-store',
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.message ?? 'Payment service is unavailable. Check status before retrying.',
    );
  return data as T;
}
export type PaymentRecord = {
  id: string;
  enrollmentId: string;
  userId: string;
  billingTeamId: string | null;
  coveredEnrollments?: {
    enrollmentId: string;
    enrollment: { registrationId: string; userId?: string; status?: string };
  }[];
  status: string;
  provider: string;
  teamNameSnapshot: string | null;
  upiCase?: {
    state: string;
    utrMasked: string | null;
    refund: { amountMinor: number; status: string } | null;
  } | null;
  environment: string;
  providerOrderId: string | null;
  amountMinor: number;
  taxAmountMinor: number;
  currency: string;
  createdAt: string;
  policySnapshot: {
    eventName?: string;
    receiptIssuer?: string;
    paymentPolicyUrl?: string;
    refundPolicyUrl?: string;
    cancellationPolicyUrl?: string;
    feeScope?: string;
  };
  enrollment: { registrationId: string; status: string };
  transactions: {
    id: string;
    providerPaymentId: string;
    status: string;
    capturedAt: string | null;
    refunds: { id: string; amountMinor: number; status: string }[];
  }[];
};
export const formatMoney = (minor: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minor / 100);
