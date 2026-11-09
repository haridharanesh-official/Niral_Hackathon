'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PopButton } from '@/components/niral/pop-button';
import { TactileField } from '@/components/niral-auth/form-controls';
import { formatMoney, paymentRequest } from './payment-api';
import styles from '@/components/niral-auth/auth.module.css';
type Case = {
  id: string;
  orderId: string;
  state: string;
  utrMasked: string | null;
  creditReferenceMasked: string | null;
  verifiedAt: string | null;
  reviewerId: string | null;
  reviewReason: string | null;
  order: {
    provider: string;
    amountMinor: number;
    environment: string;
    billingTeamId?: string | null;
    teamNameSnapshot?: string | null;
    coveredEnrollments?: {
      enrollmentId: string;
      enrollment: { registrationId: string };
    }[];
    enrollment: { registrationId: string };
  };
  refund: { status: string; evidenceMasked: string | null } | null;
};
type Queue = {
  flags: Record<string, unknown>;
  cases: Case[];
  notifications: {
    id: string;
    disposition: string;
    authentication: string;
    amountMinor: number | null;
    utrMasked: string | null;
    receivedAt: string;
  }[];
  history: {
    id: string;
    action: string;
    userId: string | null;
    metadata: unknown;
    createdAt: string;
  }[];
  totals: { verifiedMinor: number; refundedMinor: number };
  limit: number;
};
type Mailbox = {
  id: string;
  mailboxMasked: string;
  enabled: boolean;
  lastError: string | null;
  lastPollAt: string | null;
};
export function MasterUpi() {
  const [queue, setQueue] = useState<Queue | null>(null),
    [mailboxes, setMailboxes] = useState<Mailbox[]>([]),
    [selected, setSelected] = useState<Case | null>(null),
    [search, setSearch] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState(''),
    [reason, setReason] = useState(''),
    [utr, setUtr] = useState(''),
    [beneficiary, setBeneficiary] = useState(''),
    [amount, setAmount] = useState(''),
    [timestamp, setTimestamp] = useState(''),
    [checked, setChecked] = useState(false);
  const oauthStarted = useRef(false);
  const load = useCallback(async () => {
    const [q, m] = await Promise.all([
      paymentRequest<Queue>('master/upi'),
      paymentRequest<Mailbox[]>('master/upi/gmail/status'),
    ]);
    setQueue(q);
    setMailboxes(m);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code'),
      state = params.get('state');
    if ((code || params.get('error')) && !oauthStarted.current) {
      oauthStarted.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      if (code && state)
        paymentRequest('master/upi/gmail/complete', { code, state })
          .then(() => {
            setMessage('Read-only mailbox connected.');
            return load();
          })
          .catch((e) =>
            setMessage(e instanceof Error ? e.message : 'OAuth connection failed.'),
          );
      else queueMicrotask(() => setMessage('Gmail authorization was not completed.'));
    }
    queueMicrotask(() => {
      void load().catch((e) =>
        setMessage(e instanceof Error ? e.message : 'Review queue unavailable.'),
      );
    });
  }, [load]);
  async function run(action: () => Promise<unknown>, success: string, reload = true) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await action();
      if (success) setMessage(success);
      setSelected(null);
      setUtr('');
      setEvidence('');
      setBeneficiary('');
      setChecked(false);
      if (reload) await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Review action unavailable.');
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    await run(async () => {
      const result = await paymentRequest<{ authorizationUrl: string }>(
        'master/upi/gmail/connect',
        {},
      );
      window.location.assign(result.authorizationUrl);
    }, 'Opening read-only Google authorization…');
  }
  function select(record: Case) {
    setSelected(record);
    setAmount(String(record.order.amountMinor));
    setUtr('');
    setBeneficiary('');
    setTimestamp('');
    setEvidence('');
    setReason('');
    setChecked(false);
  }
  async function review(kind: 'verify' | 'reject' | 'refunds' | 'refunds/complete') {
    if (!selected || reason.trim().length < 10) {
      setMessage('Enter an audit reason of at least 10 characters.');
      return;
    }
    if (
      !window.confirm(
        `Record ${kind} for ${selected.order.enrollment.registrationId}? This creates an immutable audit entry.`,
      )
    )
      return;
    const body =
      kind === 'reject'
        ? { decision: 'REJECT', reason }
        : kind === 'refunds'
          ? { confirm: true, reason }
          : kind === 'verify'
            ? {
                decision: 'VERIFY',
                reason,
                evidenceType: 'RECEIVING_ACCOUNT_STATEMENT',
                evidenceReference: evidence,
                utr,
                beneficiary,
                amountMinor: Number(amount),
                creditedAt: timestamp,
                independentlyChecked: checked,
              }
            : {
                confirm: true,
                reason,
                evidenceReference: evidence,
                utr,
                amountMinor: Number(amount),
                completedAt: timestamp,
                direction: 'DEBIT',
                independentlyChecked: checked,
              };
    await run(
      () => paymentRequest(`master/upi/${selected.orderId}/${kind}`, body),
      kind === 'refunds'
        ? 'Refund reserved. Send funds outside this website, then record verified outgoing evidence.'
        : 'Review recorded. The database and notification outbox were updated atomically.',
    );
  }
  async function exportAll() {
    await run(
      async () => {
        const rows = ['kind,record_json'];
        const cell = (value: string) => '"' + value.replaceAll('"', '""') + '"';
        for (const kind of ['AUDIT', 'PAYMENTS'] as const) {
          let cursor: string | undefined, cutoff: string | undefined;
          do {
            const page = await paymentRequest<{
              records: unknown[];
              cutoff: string;
              nextCursor: string | null;
            }>('master/upi/export', { kind, cursor, cutoff });
            rows.push(
              ...page.records.map((record) => `${kind},${cell(JSON.stringify(record))}`),
            );
            cursor = page.nextCursor ?? undefined;
            cutoff = page.cutoff;
          } while (cursor);
        }
        const link = document.createElement('a');
        link.href = URL.createObjectURL(
          new Blob([rows.join('\n')], { type: 'text/csv' }),
        );
        link.download = 'niral-upi-financial-audit.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      },
      'All masked UPI payment and audit pages exported. No OAuth tokens or encrypted evidence are included.',
      false,
    );
  }
  function exportCsv() {
    if (!queue) return;
    const cell = (v: unknown) =>
      `"${String(v ?? '')
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const rows = [
      [
        'order',
        'registration',
        'state',
        'provider',
        'environment',
        'amountMinor',
        'utrMasked',
        'reviewer',
        'verifiedAt',
        'refund',
      ],
      ...queue.cases.map((c) => [
        c.orderId,
        c.order.enrollment.registrationId,
        c.state,
        c.order.provider,
        c.order.environment,
        c.order.amountMinor,
        c.utrMasked,
        c.reviewerId,
        c.verifiedAt,
        c.refund?.status,
      ]),
    ];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' }),
    );
    link.download = 'niral-upi-latest-200.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <section className={styles.reviewSection} aria-label="UPI payment management">
      <h2>Custom UPI payment management</h2>
      <p>
        Independent receiving-account records are mandatory. Email alerts never settle a
        payment. Personal wallets are restricted to authorized tests.
      </p>
      {queue && (
        <>
          <p>
            Verified collections: {formatMoney(queue.totals.verifiedMinor)} · Recorded
            refunds: {formatMoney(queue.totals.refundedMinor)} · Test records only.
          </p>
          <details>
            <summary>Provider status and feature flags</summary>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {JSON.stringify(queue.flags, null, 2)}
            </pre>
          </details>
        </>
      )}
      <div className={styles.actions}>
        <PopButton cream disabled={busy} onClick={connect}>
          Connect read-only Gmail
        </PopButton>
        <PopButton
          cream
          disabled={busy}
          onClick={() =>
            run(
              () => paymentRequest('master/upi/gmail/poll', {}),
              'Mailbox poll finished. Check mailbox errors and review candidates.',
            )
          }
        >
          Read permitted alerts
        </PopButton>
        <button disabled={busy} onClick={() => run(load, 'Queue refreshed.')}>
          Refresh UPI queue
        </button>
      </div>
      {mailboxes.map((m) => (
        <p key={m.id}>
          {m.mailboxMasked} · {m.enabled ? 'Connected' : 'Disconnected'} ·{' '}
          {m.lastError ??
            (m.lastPollAt
              ? `Last read ${new Date(m.lastPollAt).toLocaleString()}`
              : 'Not read yet')}{' '}
          {m.enabled && (
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => paymentRequest(`master/upi/gmail/${m.id}/disconnect`, {}),
                  'Disconnected locally. Revoke the dedicated grant in Google Account permissions too.',
                )
              }
            >
              Disconnect
            </button>
          )}
        </p>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            async () =>
              setQueue(await paymentRequest<Queue>('master/upi/search', { utr: search })),
            'Search completed.',
            false,
          );
        }}
      >
        <TactileField
          label="Search exact UTR (masked results)"
          value={search}
          inputMode="numeric"
          pattern="[0-9]{12}"
          required
          maxLength={12}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button disabled={busy} type="submit">
          Search transactions
        </button>
      </form>
      <button disabled={!queue} onClick={exportCsv}>
        Export displayed UPI records (latest 200)
      </button>
      <button disabled={busy} onClick={exportAll}>
        Export full financial audit
      </button>
      <h3>Payment claims and pending credit verification</h3>
      {queue?.cases.length === 0 && <p>No UPI orders.</p>}
      {queue?.cases.map((c) => (
        <section key={c.id} className={styles.reviewSection}>
          <h3>{c.order.enrollment.registrationId}</h3>
          <p>
            {c.state.replaceAll('_', ' ')} · {formatMoney(c.order.amountMinor)} ·{' '}
            {c.utrMasked ?? 'No UTR'} · {c.order.provider}
          </p>
          {c.order.billingTeamId && (
            <p>
              Fixed team fee: {c.order.teamNameSnapshot} ·{' '}
              {c.order.coveredEnrollments?.length} locked registrations.
            </p>
          )}
          <p>
            {c.reviewReason ?? 'No review recorded.'}{' '}
            {c.creditReferenceMasked && `Evidence ${c.creditReferenceMasked}`}
          </p>
          {c.refund && (
            <p>
              Refund {c.refund.status} · {c.refund.evidenceMasked}
            </p>
          )}
          <button disabled={busy} onClick={() => select(c)}>
            Review payment details
          </button>
        </section>
      ))}
      {selected && (
        <section className={styles.success}>
          <h3>Review {selected.order.enrollment.registrationId}</h3>
          <p>
            {selected.orderId} · {selected.state}
          </p>
          <TactileField
            label="Audit reason"
            value={reason}
            required
            minLength={10}
            onChange={(e) => setReason(e.target.value)}
          />
          <TactileField
            label="Independent statement / transfer record reference"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
          <TactileField
            label="UTR from receiving statement (or outgoing refund)"
            value={utr}
            maxLength={12}
            onChange={(e) => setUtr(e.target.value)}
          />
          <TactileField
            label="Beneficiary from receiving-account record"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
          <TactileField
            label="Recorded amount (integer paise)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TactileField
            label="Actual transaction timestamp (ISO 8601 with timezone)"
            value={timestamp}
            placeholder="2026-11-07T12:00:00Z"
            onChange={(e) => setTimestamp(e.target.value)}
          />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>
              I independently checked actual receiving-account credit / outgoing refund
              records. The email is not my evidence.
            </span>
          </label>
          <div className={styles.actions}>
            {['CLAIM_SUBMITTED', 'AWAITING_CREDIT_VERIFICATION', 'NEEDS_REVIEW'].includes(
              selected.state,
            ) && (
              <>
                <PopButton disabled={busy || !checked} onClick={() => review('verify')}>
                  Verify receiving-account credit
                </PopButton>
                <PopButton cream disabled={busy} onClick={() => review('reject')}>
                  Reject claim with reason
                </PopButton>
              </>
            )}
            {selected.state === 'VERIFIED' && (
              <PopButton cream disabled={busy} onClick={() => review('refunds')}>
                Reserve full manual refund
              </PopButton>
            )}
            {selected.state === 'REFUND_PENDING' && (
              <PopButton
                disabled={busy || !checked}
                onClick={() => review('refunds/complete')}
              >
                Record verified outgoing refund
              </PopButton>
            )}
          </div>
        </section>
      )}
      <h3>Email candidates, unmatched credits and duplicate alerts</h3>
      {queue?.notifications.map((n) => (
        <p key={n.id}>
          {n.disposition} · Authentication {n.authentication} ·{' '}
          {n.amountMinor === null ? 'Unparsed amount' : formatMoney(n.amountMinor)} ·{' '}
          {n.utrMasked ?? 'No supported UTR'} · {new Date(n.receivedAt).toLocaleString()}
        </p>
      ))}
      <details>
        <summary>Reconciliation history (latest 200)</summary>
        {queue?.history.map((h) => (
          <p key={h.id}>
            {new Date(h.createdAt).toLocaleString()} · {h.action} · Reviewer{' '}
            {h.userId ?? 'Worker'}
          </p>
        ))}
      </details>
      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}
    </section>
  );
}
