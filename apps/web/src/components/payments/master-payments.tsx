'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PopButton } from '@/components/niral/pop-button';
import { TactileField } from '@/components/niral-auth/form-controls';
import { paymentRequest, formatMoney, type PaymentRecord } from './payment-api';
import styles from '@/components/niral-auth/auth.module.css';
import { MasterUpi } from './master-upi';
type Settings = {
  id: string;
  name: string;
  paymentProvider: string;
  registrationPaymentMode: 'FREE' | 'PAID' | 'DISABLED';
  feeAmountMinor: number | null;
  taxAmountMinor: number;
  feeCurrency: string;
  feeScope: string;
  feeApprovedAt: string | null;
  paymentSettingsVersion: number;
  paymentPolicyUrl: string | null;
  refundPolicyUrl: string | null;
  cancellationPolicyUrl: string | null;
  receiptIssuer: string | null;
  registrationEnabled: boolean;
  registrationStartsAt: string | null;
  registrationEndsAt: string | null;
  maxCapacity: number | null;
  settings?: Record<string, unknown>;
};
export function MasterPayments() {
  const [event, setEvent] = useState<Settings | null>(null),
    [draft, setDraft] = useState<Settings | null>(null),
    [orders, setOrders] = useState<PaymentRecord[]>([]),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [approved, setApproved] = useState(false),
    [collection, setCollection] = useState({ productionCollection: false });
  const [registrationCounts, setRegistrationCounts] = useState<
    { eventId: string; status: string; _count: { _all: number } }[]
  >([]);
  const load = useCallback(async () => {
    try {
      const [config, list, summary] = await Promise.all([
        paymentRequest<{ event: { id: string } | null }>('config'),
        paymentRequest<PaymentRecord[]>('master/payments'),
        paymentRequest<{
          enrollments: typeof registrationCounts;
          collection: typeof collection;
        }>('master/payments/summary'),
      ]);
      setOrders(list);
      setCollection(summary.collection);
      setRegistrationCounts(summary.enrollments);
      if (config.event) {
        const value = await paymentRequest<Settings>(`master/event/${config.event.id}`);
        setEvent(value);
        setDraft(value);
        setApproved(!!value.feeApprovedAt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Master payment data could not load.');
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  async function publish() {
    if (!draft || !event || busy) return;
    if (
      !window.confirm(
        `Publish ${draft.registrationPaymentMode} with ${draft.feeScope === 'TEAM' ? 'one fixed charge per locked team' : 'one charge per participant'}? Fee changes from ${formatMoney(event.feeAmountMinor ?? 0)} to ${formatMoney(draft.feeAmountMinor ?? 0)}, plus ${formatMoney(draft.taxAmountMinor)} tax. Existing enrollments, orders and receipts keep their original terms.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await paymentRequest(
        `master/events/${event.id}/payment-settings`,
        {
          mode: draft.registrationPaymentMode,
          provider: draft.paymentProvider,
          amountMinor: draft.feeAmountMinor ?? 0,
          taxAmountMinor: draft.taxAmountMinor,
          currency: 'INR',
          feeScope: draft.feeScope,
          feeApproved: approved,
          expectedVersion: event.paymentSettingsVersion,
          expectedOldAmountMinor: event.feeAmountMinor ?? 0,
          confirmPublish: true,
          ...(draft.paymentPolicyUrl ? { paymentPolicyUrl: draft.paymentPolicyUrl } : {}),
          ...(draft.refundPolicyUrl ? { refundPolicyUrl: draft.refundPolicyUrl } : {}),
          ...(draft.cancellationPolicyUrl
            ? { cancellationPolicyUrl: draft.cancellationPolicyUrl }
            : {}),
          ...(draft.receiptIssuer ? { receiptIssuer: draft.receiptIssuer } : {}),
        },
        'PATCH',
      );
      setMessage(
        'Payment settings published and audited. Existing payment snapshots were preserved.',
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Settings could not publish.');
    } finally {
      setBusy(false);
    }
  }
  async function saveRegistration() {
    if (!draft || !event || busy) return;
    if (
      !window.confirm(
        `Publish registration ${draft.registrationEnabled ? 'OPEN' : 'CLOSED'} with capacity ${draft.maxCapacity ?? 'unlimited'} and the displayed dates/eligibility rules? Payment mode remains separately controlled.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await paymentRequest(
        `master/event/${event.id}`,
        {
          registrationEnabled: draft.registrationEnabled,
          registrationStartsAt: draft.registrationStartsAt,
          registrationEndsAt: draft.registrationEndsAt,
          maxCapacity: draft.maxCapacity,
          status: draft.registrationEnabled ? 'REGISTRATION_OPEN' : 'REGISTRATION_CLOSED',
          settings: draft.settings ?? {},
        },
        'PATCH',
      );
      setMessage('Registration settings published and audited.');
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Registration settings could not publish.',
      );
    } finally {
      setBusy(false);
    }
  }
  function report() {
    const text = [
      'reference,registration,environment,amountMinor,currency,status,createdAt',
      ...orders.map((o) =>
        [
          o.id,
          o.enrollment.registrationId,
          o.environment,
          o.amountMinor,
          o.currency,
          o.status,
          o.createdAt,
        ].join(','),
      ),
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    link.download = 'niral-payments-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <div className={styles.form}>
      <h1>Registration & payment controls</h1>
      <p className={styles.notice}>
        Custom UPI �{' '}
        {collection.productionCollection
          ? 'Collection available'
          : 'Production collection disabled'}
        . Only independent receiving-account credit verification can confirm paid
        enrollment.
      </p>
      <MasterUpi />
      {draft && event ? (
        <section className={styles.success}>
          <h2>{draft.name}</h2>
          <p>
            Confirmed:{' '}
            {registrationCounts
              .filter((c) => c.eventId === event.id && c.status === 'CONFIRMED')
              .reduce((n, c) => n + c._count._all, 0)}{' '}
            · Pending:{' '}
            {registrationCounts
              .filter((c) => c.eventId === event.id && c.status === 'PENDING')
              .reduce((n, c) => n + c._count._all, 0)}
          </p>
          <div className={styles.form}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={draft.registrationEnabled}
                disabled={busy}
                onChange={(e) =>
                  setDraft((v) =>
                    v ? { ...v, registrationEnabled: e.target.checked } : v,
                  )
                }
              />
              <span>
                Event registration open (payment mode must also permit enrollment)
              </span>
            </label>
            {(['registrationStartsAt', 'registrationEndsAt'] as const).map((key) => (
              <TactileField
                key={key}
                label={
                  key === 'registrationStartsAt'
                    ? 'Registration opens (UTC)'
                    : 'Registration closes (UTC)'
                }
                type="datetime-local"
                value={draft[key]?.slice(0, 16) ?? ''}
                disabled={busy}
                onChange={(e) =>
                  setDraft((v) =>
                    v
                      ? {
                          ...v,
                          [key]: e.target.value
                            ? new Date(`${e.target.value}:00Z`).toISOString()
                            : null,
                        }
                      : v,
                  )
                }
              />
            ))}
            <TactileField
              label="Enrollment capacity (blank means unlimited)"
              type="number"
              min={1}
              value={draft.maxCapacity ?? ''}
              disabled={busy}
              onChange={(e) =>
                setDraft((v) =>
                  v
                    ? {
                        ...v,
                        maxCapacity: e.target.value ? Number(e.target.value) : null,
                      }
                    : v,
                )
              }
            />
            <label className={styles.field}>
              Published student eligibility rules
              <textarea
                className={styles.textarea}
                value={String(draft.settings?.eligibilityText ?? '')}
                disabled={busy}
                onChange={(e) =>
                  setDraft((v) =>
                    v
                      ? {
                          ...v,
                          settings: { ...v.settings, eligibilityText: e.target.value },
                        }
                      : v,
                  )
                }
              />
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={draft.settings?.studentIdRequired === true}
                disabled={busy}
                onChange={(e) =>
                  setDraft((v) =>
                    v
                      ? {
                          ...v,
                          settings: {
                            ...v.settings,
                            studentIdRequired: e.target.checked,
                          },
                        }
                      : v,
                  )
                }
              />
              <span>Require student / roll ID for this event</span>
            </label>
            <PopButton cream disabled={busy} onClick={saveRegistration}>
              Review and publish registration controls
            </PopButton>
            <label className={styles.field}>
              Registration payment mode
              <select
                className={styles.select}
                value={draft.registrationPaymentMode}
                onChange={(e) =>
                  setDraft((v) =>
                    v
                      ? {
                          ...v,
                          registrationPaymentMode: e.target
                            .value as Settings['registrationPaymentMode'],
                        }
                      : v,
                  )
                }
              >
                <option>DISABLED</option>
                <option>FREE</option>
                <option>PAID</option>
              </select>
            </label>
            <label>
              Payment provider
              <select
                value={draft.paymentProvider}
                onChange={(e) =>
                  setDraft((v) => (v ? { ...v, paymentProvider: e.target.value } : v))
                }
              >
                <option value="MANUAL_UPI">Custom UPI (authorized test)</option>
                <option value="FAMAPP_SANDBOX">
                  FamApp sandbox (personal test only)
                </option>
              </select>
            </label>
            <TactileField
              label="Approved fee (integer paise)"
              type="number"
              min={0}
              step={1}
              value={draft.feeAmountMinor ?? 0}
              onChange={(e) =>
                setDraft((v) =>
                  v ? { ...v, feeAmountMinor: Number(e.target.value) } : v,
                )
              }
            />
            <TactileField
              label="Approved tax amount (integer paise)"
              type="number"
              min={0}
              step={1}
              value={draft.taxAmountMinor}
              onChange={(e) =>
                setDraft((v) =>
                  v ? { ...v, taxAmountMinor: Number(e.target.value) } : v,
                )
              }
            />
            <label className={styles.field}>
              Pricing scope
              <select
                className={styles.select}
                value={draft.feeScope}
                onChange={(e) =>
                  setDraft((v) => (v ? { ...v, feeScope: e.target.value } : v))
                }
              >
                <option value="PARTICIPANT">Per participant</option>
                <option value="TEAM">One fixed fee per locked team</option>
              </select>
            </label>
            <p>
              Currency: INR. Team pricing charges the leader once and freezes the verified
              enrolled roster. Published fee and policy snapshots remain unchanged.
            </p>
            {(
              [
                'receiptIssuer',
                'paymentPolicyUrl',
                'refundPolicyUrl',
                'cancellationPolicyUrl',
              ] as const
            ).map((key) => (
              <TactileField
                key={key}
                label={
                  {
                    receiptIssuer: 'Approved receipt issuer',
                    paymentPolicyUrl: 'Payment terms HTTPS URL',
                    refundPolicyUrl: 'Refund policy HTTPS URL',
                    cancellationPolicyUrl: 'Cancellation policy HTTPS URL',
                  }[key]
                }
                type={key.endsWith('Url') ? 'url' : 'text'}
                value={draft[key] ?? ''}
                onChange={(e) =>
                  setDraft((v) => (v ? { ...v, [key]: e.target.value } : v))
                }
              />
            ))}
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span>
                The amount, tax treatment, receipt issuer and policies above are
                officially approved.
              </span>
            </label>
            <PopButton disabled={busy} onClick={publish}>
              Review and publish settings
            </PopButton>
            <Link href="/admin/event-settings">
              Registration dates, capacity, eligibility and team settings →
            </Link>
          </div>
        </section>
      ) : (
        <p role="status">No event loaded. Configure a published event first.</p>
      )}
      <div className={styles.actions}>
        <button className={styles.textButton} disabled={busy} onClick={() => void load()}>
          Refresh
        </button>
        <button className={styles.textButton} onClick={report} disabled={!orders.length}>
          Download transaction report
        </button>
      </div>
      {message && (
        <p role="status" className={styles.success}>
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}
      {orders.map((order) => (
        <section key={order.id} className={styles.reviewSection}>
          <h2>{order.enrollment.registrationId}</h2>
          <p>
            {order.id} · {formatMoney(order.amountMinor)} ·{' '}
            {order.environment.toUpperCase()} · {order.status}
          </p>
          <p>
            {order.provider} � Historical payment and refund records remain read-only
            here. Use the UPI review queue for new claims.
          </p>
          {order.transactions
            .flatMap((t) => t.refunds)
            .map((r) => (
              <p key={r.id}>
                Refund {formatMoney(r.amountMinor)} · {r.status}
              </p>
            ))}
        </section>
      ))}
    </div>
  );
}
