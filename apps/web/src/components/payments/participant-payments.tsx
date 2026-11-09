'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import { paymentRequest, formatMoney, type PaymentRecord } from './payment-api';
import styles from '@/components/niral-auth/auth.module.css';
import { UpiCheckout } from './upi-checkout';

export function ParticipantPayments({
  orderId,
  enrollmentId,
}: {
  orderId?: string;
  enrollmentId?: string;
}) {
  const [records, setRecords] = useState<PaymentRecord[]>([]),
    [active, setActive] = useState<PaymentRecord | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice] = useState('');
  const [identity, setIdentity] = useState(''),
    [loadedOwner, setLoadedOwner] = useState(''),
    [enrollment, setEnrollment] = useState<{
      id: string;
      registrationId: string;
      status: string;
      paymentModeSnapshot: string;
      paymentProviderSnapshot: string;
      feeAmountSnapshot: number;
      taxAmountSnapshot: number;
      feeCurrencySnapshot: string;
      paymentPolicySnapshot?: PaymentRecord['policySnapshot'];
    } | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const { data: session } = useSession();
  const userId = session?.user.id;
  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const requestGeneration = ++generation.current;
    setError('');
    try {
      const [orders, profile, application] = await Promise.all([
        paymentRequest<PaymentRecord[]>('me'),
        accountRequest<{ name: string }>('profile'),
        accountRequest<{ enrollment: typeof enrollment }>('application'),
      ]);
      if (requestGeneration !== generation.current) return;
      setRecords(orders);
      setIdentity(profile.name);
      setEnrollment(application.enrollment);
      setLoadedOwner(userId);
      if (orderId) setActive(orders.find((order) => order.id === orderId) ?? null);
      else if (enrollmentId)
        setActive(
          orders.find(
            (o) =>
              o.enrollmentId === enrollmentId ||
              o.coveredEnrollments?.some((c) => c.enrollmentId === enrollmentId),
          ) ?? null,
        );
    } catch (e) {
      if (requestGeneration !== generation.current) return;
      setRecords([]);
      setActive(null);
      setEnrollment(null);
      setIdentity('');
      setError(e instanceof Error ? e.message : 'Unable to load payment records.');
      setLoadedOwner(userId);
    } finally {
      if (requestGeneration === generation.current) setLoading(false);
    }
    // The enrollment response type does not depend on its current state.
  }, [orderId, enrollmentId, userId]);
  useEffect(() => {
    const counter = generation;
    queueMicrotask(() => {
      setRecords([]);
      setActive(null);
      setEnrollment(null);
      setIdentity('');
      void load();
    });
    return () => {
      counter.current++;
    };
  }, [load]);
  const activeId = active?.id;
  const activeStatus = active?.status;
  useEffect(() => {
    if (
      !activeId ||
      !activeStatus ||
      !['PENDING', 'AUTHORIZED', 'CREATED'].includes(activeStatus)
    )
      return;
    let current = true,
      attempts = 0;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || ++attempts > 24) return;
      paymentRequest<PaymentRecord>(`orders/${activeId}/status`)
        .then((result) => {
          if (current) setActive(result);
        })
        .catch(() => {
          /* Explicit refresh remains available. */
        });
    }, 5000);
    return () => {
      current = false;
      clearInterval(timer);
    };
  }, [activeId, activeStatus]);
  async function refresh(id: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const requestGeneration = generation.current;
    try {
      const result = await paymentRequest<PaymentRecord>(`orders/${id}/refresh`, {});
      if (requestGeneration !== generation.current) return;
      setActive(result);
      setRecords((v) => v.map((row) => (row.id === id ? result : row)));
    } catch (e) {
      if (requestGeneration !== generation.current) return;
      setError(
        e instanceof Error
          ? e.message
          : 'Status is unresolved. Try checking again later.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function checkout() {
    const target = enrollmentId ?? active?.enrollmentId;
    if (!target || lock.current) return;
    const requestGeneration = generation.current;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const created = await paymentRequest<{ id: string }>('orders', {
        enrollmentId: target,
      });
      const order = await paymentRequest<PaymentRecord>(`orders/${created.id}/status`);
      if (requestGeneration === generation.current) setActive(order);
    } catch (e) {
      if (requestGeneration === generation.current)
        setError(e instanceof Error ? e.message : 'UPI checkout is unavailable.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const captured = active?.transactions.some((t) => t.capturedAt);
  const snapshot = active?.policySnapshot ?? enrollment?.paymentPolicySnapshot;
  const total =
    active?.amountMinor ??
    (enrollment?.feeAmountSnapshot ?? 0) + (enrollment?.taxAmountSnapshot ?? 0);
  const title =
    active?.status === 'CAPTURED'
      ? 'Payment verified.'
      : active?.status === 'AUTHORIZED'
        ? 'Authorized · awaiting capture.'
        : active?.status === 'FAILED'
          ? 'Payment attempt unsuccessful.'
          : active
            ? 'Check your payment status.'
            : enrollmentId
              ? 'Secure event checkout.'
              : 'Your payment history.';
  return (
    <div className={styles.form}>
      <h1>{title}</h1>
      <p className={styles.hint}>
        Account creation, payment claims and event enrollment are separate states.
        Independent receiving-account credit verification confirms paid enrollment.
      </p>
      {loading || loadedOwner !== session?.user.id ? (
        <p role="status">Loading your records…</p>
      ) : (
        <>
          {enrollmentId && enrollment?.id !== enrollmentId ? (
            <p className={styles.notice}>
              No matching enrollment belongs to this account.
            </p>
          ) : (
            (active || enrollmentId) && (
              <section className={styles.success}>
                <h2>{snapshot?.eventName ?? 'NIRAL Hackathon 2026'}</h2>
                <dl className={styles.details}>
                  <dt>Participant</dt>
                  <dd>{identity}</dd>
                  <dt>Registration</dt>
                  <dd>
                    {active?.coveredEnrollments?.find(
                      (c) => c.enrollment.userId === userId,
                    )?.enrollment.registrationId ??
                      active?.enrollment.registrationId ??
                      enrollment?.registrationId}
                  </dd>
                  <dt>Purpose</dt>
                  <dd>Participant enrollment</dd>
                  <dt>Team</dt>
                  <dd>
                    {active?.teamNameSnapshot ??
                      'Team setup follows confirmed enrollment.'}
                  </dd>
                  {active?.billingTeamId && (
                    <>
                      <dt>Covered registrations</dt>
                      <dd>
                        {active.coveredEnrollments
                          ?.map((c) => c.enrollment.registrationId)
                          .join(', ')}
                      </dd>
                    </>
                  )}
                  <dt>Payment purpose</dt>
                  <dd>Event enrollment fee</dd>
                  <dt>Fee</dt>
                  <dd>
                    {formatMoney(
                      total -
                        (active?.taxAmountMinor ?? enrollment?.taxAmountSnapshot ?? 0),
                    )}
                  </dd>
                  <dt>Configured tax</dt>
                  <dd>
                    {formatMoney(
                      active?.taxAmountMinor ?? enrollment?.taxAmountSnapshot ?? 0,
                    )}
                  </dd>
                  <dt>Total</dt>
                  <dd>
                    {formatMoney(
                      total,
                      active?.currency ?? enrollment?.feeCurrencySnapshot,
                    )}
                  </dd>
                  <dt>Payment state</dt>
                  <dd>
                    {active?.upiCase?.state ?? active?.status ?? 'Awaiting payment'}
                  </dd>
                  <dt>Enrollment</dt>
                  <dd>
                    {active?.coveredEnrollments?.find(
                      (c) => c.enrollment.userId === userId,
                    )?.enrollment.status ??
                      active?.enrollment.status ??
                      enrollment?.status}
                  </dd>
                  {active && (
                    <>
                      <dt>Reference</dt>
                      <dd>{active.id}</dd>
                      <dt>Environment</dt>
                      <dd>{active.environment.toUpperCase()}</dd>
                    </>
                  )}
                </dl>
                <p className={styles.links}>
                  {snapshot?.paymentPolicyUrl && (
                    <a
                      href={snapshot.paymentPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Payment terms
                    </a>
                  )}
                  {snapshot?.cancellationPolicyUrl && (
                    <a
                      href={snapshot.cancellationPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cancellation policy
                    </a>
                  )}
                  {snapshot?.refundPolicyUrl && (
                    <a
                      href={snapshot.refundPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Refund policy
                    </a>
                  )}
                </p>
                {active?.status === 'AUTHORIZED' && (
                  <p role="status">
                    Authorization is not capture. Keep this reference and check again; do
                    not start a second payment.
                  </p>
                )}
                {active && ['MANUAL_UPI', 'FAMAPP_SANDBOX'].includes(active.provider) && (
                  <UpiCheckout
                    key={`${session?.user.id}:${active.id}`}
                    orderId={active.id}
                    onUpdate={load}
                    canPay={active.userId === userId}
                  />
                )}
                {snapshot?.feeScope === 'TEAM' && (
                  <p>
                    One fixed fee covers the locked team roster. The team leader manages
                    checkout; every member must enroll before the leader pays.{' '}
                    <Link href="/dashboard/team">Set up your team</Link>
                  </p>
                )}
                <div className={styles.actions}>
                  {!active &&
                    !captured &&
                    (active || enrollment?.paymentModeSnapshot === 'PAID') && (
                      <PopButton disabled={busy} onClick={checkout}>
                        {busy ? 'Creating UPI order…' : 'Continue to UPI checkout'}
                      </PopButton>
                    )}
                  {active && (
                    <PopButton cream disabled={busy} onClick={() => refresh(active.id)}>
                      Refresh payment status
                    </PopButton>
                  )}
                  {captured && (
                    <a href={`/api/payments/${active!.id}/receipt`} download>
                      Download verified receipt
                    </a>
                  )}
                  <Link href="/dashboard">Participant dashboard</Link>
                </div>
              </section>
            )
          )}
          {!enrollmentId && !orderId && !records.length && (
            <p className={styles.notice}>
              No payment history.{' '}
              {enrollment?.paymentModeSnapshot === 'FREE'
                ? 'Your enrollment uses free registration; no payment is requested.'
                : 'Complete event enrollment before starting payment.'}
            </p>
          )}
          {orderId && !active && (
            <p className={styles.notice}>
              No payment record belongs to this account for that reference.
            </p>
          )}
          {records.map((row) => (
            <section className={styles.reviewSection} key={row.id}>
              <h2>{row.enrollment.registrationId}</h2>
              <p>
                {formatMoney(row.amountMinor, row.currency)} ·{' '}
                {row.upiCase?.state ?? row.status} ·{' '}
                {new Date(row.createdAt).toLocaleString()}
              </p>
              <Link href={`/dashboard/payments/${row.id}`}>
                View status and receipt →
              </Link>
              {row.transactions
                .flatMap((t) => t.refunds)
                .map((refund) => (
                  <p key={refund.id}>
                    Refund {formatMoney(refund.amountMinor, row.currency)} ·{' '}
                    {refund.status}
                  </p>
                ))}
            </section>
          ))}
          {enrollment?.paymentModeSnapshot === 'PAID' &&
            enrollment.status === 'PENDING' &&
            !active &&
            !enrollmentId && (
              <PopButton href={`/dashboard/payments/checkout/${enrollment.id}`}>
                Continue to payment
              </PopButton>
            )}
        </>
      )}
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}
      <div className={styles.links}>
        <button className={styles.textButton} onClick={() => void load()} disabled={busy}>
          Reload records
        </button>
        <Link href="/contact">Contact support</Link>
        <Link href="/dashboard/application">Enrollment status</Link>
      </div>
    </div>
  );
}
