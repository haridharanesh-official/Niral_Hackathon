'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  NiralAuthLayout,
  NiralAuthCard,
  NiralTextField,
  NiralFormAlert,
  NiralSuccessState,
} from '@/components/niral-auth/niral-auth-system';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/niral-auth/niral-auth.module.css';

export function AccountRecoveryForm() {
  const [fullName, setFullName] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [alternateContact, setAlternateContact] = useState('');
  const [reason, setReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Enter your full name (at least 2 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail.trim())) {
      errs.registeredEmail = 'Enter a valid registered email address.';
    }
    if (!alternateContact.trim() || alternateContact.trim().length < 5) {
      errs.alternateContact = 'Provide an alternate email or active phone number.';
    }
    if (!reason.trim() || reason.trim().length < 10) {
      errs.reason = 'Please explain the issue you are experiencing (at least 10 characters).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate() || busy) return;

    setBusy(true);
    try {
      const response = await accountRequest<{ success: boolean; message: string }>(
        'account-recovery',
        {
          fullName: fullName.trim(),
          email: registeredEmail.trim().toLowerCase(),
          alternateContact: alternateContact.trim(),
          reason: reason.trim(),
        },
      );

      setSuccessMessage(
        response.message ||
          'Your recovery ticket has been submitted to NIRAL support. Our team will verify your identity and contact you.',
      );
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to submit recovery request right now. Please try again later.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <NiralAuthLayout
      actionType="register"
      kicker="NIRAL 2026 · PARTICIPANT SUPPORT"
      headlineTitle="Need help accessing"
      headlineHighlight="your account?"
      description="If you lost access to your registered email or cannot sign in, submit an account recovery ticket. Our organizing team will verify your identity."
    >
      <NiralAuthCard
        eyebrow="SUPPORT &amp; RECOVERY"
        title="Account Recovery"
        subtitle="Submit a verified recovery request to the NIRAL 2026 organizing committee."
      >
        {successMessage ? (
          <NiralSuccessState
            title="Recovery Ticket Received"
            message={successMessage}
            primaryAction={{
              label: 'Return to Sign In →',
              href: '/login',
            }}
            secondaryAction={{
              label: 'Contact Support Directly',
              href: '/contact',
            }}
          />
        ) : (
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <NiralFormAlert message={serverError} variant="error" />

            <NiralTextField
              label="Full name"
              placeholder="e.g. Aditi Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              error={errors.fullName}
            />

            <NiralTextField
              label="Registered email address (inaccessible)"
              type="email"
              placeholder="you@example.com"
              value={registeredEmail}
              onChange={(e) => setRegisteredEmail(e.target.value)}
              required
              error={errors.registeredEmail}
            />

            <NiralTextField
              label="Alternate contact (phone or accessible email)"
              placeholder="+91 98765 43210 or alternate@example.com"
              value={alternateContact}
              onChange={(e) => setAlternateContact(e.target.value)}
              required
              error={errors.alternateContact}
            />

            <div className={styles.fieldGroup}>
              <label htmlFor="recovery-reason" className={styles.label}>
                <span>
                  Description of issue <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              <textarea
                id="recovery-reason"
                className={`${styles.textarea} ${errors.reason ? styles.inputInvalid : ''}`}
                rows={4}
                placeholder="Explain why you cannot access your account (e.g. phone lost, college email blocked, typo in registration email)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                aria-required="true"
                aria-invalid={!!errors.reason}
                aria-describedby={errors.reason ? 'reason-error' : undefined}
              />
              {errors.reason && (
                <span id="reason-error" className={styles.fieldError} role="alert">
                  {errors.reason}
                </span>
              )}
            </div>

            <PopButton
              type="submit"
              className={styles.authSubmitButton}
              disabled={busy}
            >
              {busy ? 'Submitting ticket…' : 'Submit Recovery Ticket →'}
            </PopButton>

            <div className={styles.cardFooterLinks}>
              <span>Remembered your password?</span>
              <Link href="/login">Return to Sign In</Link>
            </div>
          </form>
        )}
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}
