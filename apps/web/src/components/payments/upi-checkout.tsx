'use client';
import { useCallback, useEffect, useState } from 'react';
import { PopButton } from '@/components/niral/pop-button';
import { TactileField } from '@/components/niral-auth/form-controls';
import { paymentRequest } from './payment-api';
import styles from '@/components/niral-auth/auth.module.css';
type UpiDetail = {
  id: string;
  upiCase: { state: string; utrMasked: string | null; refund: { status: string } | null };
  checkout?: {
    upiId: string;
    upiUri: string;
    qrDataUrl: string;
    instructions: string;
  } | null;
};
export function UpiCheckout({
  orderId,
  onUpdate,
  canPay = true,
}: {
  orderId: string;
  onUpdate: () => Promise<void>;
  canPay?: boolean;
}) {
  const [data, setData] = useState<UpiDetail | null>(null),
    [utr, setUtr] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setData(await paymentRequest<UpiDetail>(`upi/${orderId}`));
  }, [orderId]);
  useEffect(() => {
    let current = true;
    paymentRequest<UpiDetail>(`upi/${orderId}`)
      .then((v) => {
        if (current) setData(v);
      })
      .catch((e) => {
        if (current) setMessage(e instanceof Error ? e.message : 'Unable to read claim.');
      });
    return () => {
      current = false;
    };
  }, [orderId]);
  async function action(kind: 'checkout' | 'claim') {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await paymentRequest<UpiDetail>(
        `upi/${orderId}/${kind}`,
        kind === 'claim' ? { utr } : {},
      );
      setData(result);
      setUtr('');
      if (kind === 'claim') {
        setMessage(
          'Claim submitted for review. Email matches do not prove settlement. Do not pay twice.',
        );
        await onUpdate();
      }
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'Request unavailable. Contact support.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.reviewSection} aria-label="Custom UPI checkout">
      <h2>NIRAL custom UPI</h2>
      {!canPay && (
        <p>
          The team leader manages this payment. Your covered enrollment and receipt are
          visible here.
        </p>
      )}
      <p role="status">{data?.upiCase.state.replaceAll('_', ' ') ?? 'Loading claim…'}</p>
      <p>
        UPI claims and Gmail alerts await independent receiving-account verification.
        Registration activates only after verified credit.
      </p>
      {data?.upiCase.utrMasked && <p>Submitted reference: {data.upiCase.utrMasked}</p>}
      {canPay && data?.upiCase.state === 'PENDING' && (
        <PopButton cream disabled={busy} onClick={() => action('checkout')}>
          Show authorized test QR
        </PopButton>
      )}
      {data?.checkout && (
        <>
          <p className={styles.notice}>{data.checkout.instructions}</p>
          {/* A server-generated local data URL; never a remote wallet image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.checkout.qrDataUrl}
            alt="Authorized personal test UPI QR"
            width={256}
            height={256}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <p style={{ overflowWrap: 'anywhere' }}>UPI ID: {data.checkout.upiId}</p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                .writeText(data.checkout!.upiId)
                .then(() => setMessage('Test UPI ID copied.'))
                .catch(() =>
                  setMessage('Copy is unavailable; select the displayed UPI ID.'),
                );
            }}
          >
            Copy UPI ID
          </button>
          <p>
            Scan with a UPI-compatible app only for an explicitly authorized personal
            test. This preview does not collect event fees.
          </p>
        </>
      )}
      {data?.checkout && (
        <a href={data.checkout.upiUri}>Open authorized personal test in a UPI app</a>
      )}
      {canPay && data?.upiCase.state === 'PENDING' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action('claim');
          }}
        >
          <TactileField
            label="UPI transaction reference / UTR"
            value={utr}
            inputMode="numeric"
            pattern="[0-9]{12}"
            maxLength={12}
            required
            onChange={(e) => setUtr(e.target.value)}
          />
          <PopButton type="submit" disabled={busy || !/^\d{12}$/.test(utr)}>
            Submit claim for verification
          </PopButton>
        </form>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void load().catch((e) =>
            setMessage(e instanceof Error ? e.message : 'Status unavailable.'),
          );
        }}
      >
        Refresh claim status
      </button>
      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}
    </section>
  );
}
