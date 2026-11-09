'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { paymentRequest, type PaymentRecord } from './payment-api';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/niral-auth/auth.module.css';
export function PaymentSummary() {
  const { data: session } = useSession();
  const [value, setValue] = useState<{
      ownerId: string;
      payment?: PaymentRecord;
      enrollment?: {
        id: string;
        status: string;
        paymentModeSnapshot: string;
        registrationId: string;
      };
    } | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      setValue(null);
      setError('');
    });
    if (!session?.user.id)
      return () => {
        active = false;
      };
    Promise.all([
      paymentRequest<PaymentRecord[]>('me'),
      accountRequest<{ enrollment: NonNullable<typeof value>['enrollment'] }>(
        'application',
      ),
    ])
      .then(([payments, application]) => {
        if (active)
          setValue({
            ownerId: session.user.id,
            payment: payments.find(
              (p) =>
                p.enrollmentId === application.enrollment?.id ||
                p.coveredEnrollments?.some(
                  (c) => c.enrollmentId === application.enrollment?.id,
                ),
            ),
            enrollment: application.enrollment,
          });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  return (
    <section className={styles.success}>
      <h2>Enrollment & payment</h2>
      {value && value.ownerId === session?.user.id ? (
        <>
          <p>Enrollment: {value.enrollment?.status ?? 'Not enrolled'}</p>
          <p>{value.enrollment?.registrationId}</p>
          <p>
            Payment:{' '}
            {value.enrollment?.paymentModeSnapshot === 'FREE'
              ? 'Free registration'
              : (value.payment?.upiCase?.state ??
                value.payment?.status ??
                (value.enrollment?.paymentModeSnapshot === 'PAID'
                  ? 'Awaiting payment'
                  : 'Not required / not started'))}
          </p>
          {value.payment?.transactions.some((t) => t.capturedAt) && (
            <a href={`/api/payments/${value.payment.id}/receipt`} download>
              Download receipt
            </a>
          )}
        </>
      ) : (
        <p role="status">{error || 'Loading your current records…'}</p>
      )}
      <p>
        <Link href="/dashboard/payments">Payment history and checkout →</Link>
      </p>
    </section>
  );
}
