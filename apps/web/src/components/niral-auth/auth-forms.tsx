'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { validatePasswordPolicy } from '@hackos/shared';
import { PopButton } from '@/components/niral/pop-button';
import {
  NiralAuthLayout,
  NiralAuthCard,
  NiralTextField,
  NiralPasswordField,
  NiralFormAlert,
  NiralSuccessState,
  NiralPasswordStrength,
} from './niral-auth-system';
import { accountRequest } from './account-api';
import styles from './niral-auth.module.css';

const roleDestinations: Record<string, string> = {
  PARTICIPANT: '/dashboard',
  TEAM_LEADER: '/dashboard',
  VOLUNTEER: '/volunteer',
  JUDGE: '/judge',
  ORGANIZER: '/organizer',
  ADMIN: '/master',
  MENTOR: '/dashboard/mentor',
  SPONSOR: '/dashboard/sponsor',
  VISITOR: '/',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254;
}

/* -------------------------------------------------------------------------- */
/* 1. LoginExperience                                                         */
/* -------------------------------------------------------------------------- */
export function LoginExperience() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lock = useRef(false);
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem('niral.login.email');
        if (saved) {
          setEmail(saved);
          setRemember(true);
        }
      } catch {
        /* Storage preference optional */
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;

    const nextErrors: Record<string, string> = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    lock.current = true;
    setBusy(true);
    setErrorMessage('');

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        const code = result.code;
        setErrorMessage(
          code === 'email_unverified'
            ? 'Verify your email before signing in. Check your inbox or request a new verification link below.'
            : code === 'security_transition_required'
              ? 'Check your inbox for a secure account transition link. Confirm it before signing in.'
              : code === 'rate_limited'
                ? 'Too many sign-in attempts. Please wait a minute before retrying.'
                : code === 'service_unavailable'
                  ? 'Sign-in is temporarily unavailable. Please try again in a few moments.'
                  : 'Invalid email or password. Please verify your credentials and try again.',
        );
        return;
      }

      try {
        if (remember) {
          localStorage.setItem('niral.login.email', email.trim());
        } else {
          localStorage.removeItem('niral.login.email');
        }
      } catch {
        /* Storage preference optional */
      }

      const session = await getSession();
      if (!session?.user) {
        throw new Error('Your session could not be established. Please retry.');
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      router.replace(
        next === '/profile-completion' || next === '/invite'
          ? next
          : (roleDestinations[session.user.role] ?? '/dashboard'),
      );
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Sign-in is currently unavailable.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · SECURE ACCESS"
      headlineTitle="Welcome back to"
      headlineHighlight="NIRAL."
      description="Sign in to continue your innovation journey, access team management, and explore official tracks."
    >
      <NiralAuthCard
        eyebrow="PARTICIPANT WORKSPACE"
        title="Sign in to your account"
        subtitle="Enter your registered credentials to access your participant dashboard."
      >
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <NiralFormAlert message={errorMessage} variant="error" />

          <NiralTextField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            required
            error={fieldErrors.email}
          />

          <NiralPasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            required
            error={fieldErrors.password}
          />

          <div className={styles.formMetaRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember my email on this device</span>
            </label>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <PopButton
            type="submit"
            className={styles.authSubmitButton}
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Sign In →'}
          </PopButton>

          <div className={styles.socialDisabledNotice}>
            Single Sign-On (Google / GitHub) is disabled until official provider linking is verified.
          </div>

          <div className={styles.cardFooterLinks}>
            <div>
              New to NIRAL?{' '}
              <Link href="/register">Create an account</Link>
            </div>
            <div>
              Need to confirm email?{' '}
              <Link href="/verify-email">Verify email link</Link>
            </div>
            <div>
              Can&apos;t access registered email?{' '}
              <Link href="/account-recovery">Request account recovery</Link>
            </div>
          </div>
        </form>
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. ForgotExperience                                                        */
/* -------------------------------------------------------------------------- */
export function ForgotExperience() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;

    if (!email.trim() || !isValidEmail(email)) {
      setError('Enter a valid registered email address.');
      return;
    }

    setError('');
    lock.current = true;
    setBusy(true);

    try {
      const result = await accountRequest<{ message: string }>('forgot-password', {
        email: email.trim().toLowerCase(),
      });
      void result;
      setSubmittedMessage(
        'If that email matches an eligible account, password recovery instructions are on their way. Check your inbox and spam folder.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Password recovery is currently unavailable.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · ACCOUNT RECOVERY"
      headlineTitle="Forgot your"
      headlineHighlight="password?"
      description="We’ll help you regain access. Enter your registered email to receive a secure, one-time recovery link."
    >
      <NiralAuthCard
        eyebrow="RECOVERY"
        title="Forgot your password?"
        subtitle="If an account exists for this address, we’ll email you instructions to choose a new password."
      >
        {submittedMessage ? (
          <NiralSuccessState
            title="Check your inbox"
            message={submittedMessage}
            primaryAction={{
              label: 'Return to Sign In →',
              href: '/login',
            }}
            secondaryAction={{
              label: 'Try another email',
              onClick: () => {
                setSubmittedMessage('');
                setEmail('');
              },
            }}
          />
        ) : (
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <NiralFormAlert message={error} variant="error" />

            <NiralTextField
              label="Registered email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
            />

            <PopButton
              type="submit"
              className={styles.authSubmitButton}
              disabled={busy}
            >
              {busy ? 'Sending link…' : 'Send Recovery Email →'}
            </PopButton>

            <div className={styles.cardFooterLinks}>
              <Link href="/login">← Back to Sign In</Link>
              <span>·</span>
              <Link href="/account-recovery">Can&apos;t access email? Support</Link>
            </div>
          </form>
        )}
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper to parse link tokens                                                */
/* -------------------------------------------------------------------------- */
function useLinkToken() {
  const [token, setToken] = useState<string | null>(null);
  const captured = useRef<string | null>(null);

  useEffect(() => {
    const value =
      captured.current ??
      new URLSearchParams(window.location.hash.slice(1)).get('token') ??
      new URLSearchParams(window.location.search).get('token') ??
      '';
    captured.current = value;
    if (value) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    queueMicrotask(() => setToken(value));
  }, []);

  return token;
}

/* -------------------------------------------------------------------------- */
/* 3. VerifyExperience                                                        */
/* -------------------------------------------------------------------------- */
export function VerifyExperience() {
  const token = useLinkToken();
  const [email, setEmail] = useState('');
  const [delivery, setDelivery] = useState('');
  const [statusState, setStatusState] = useState<'ready' | 'verifying' | 'success' | 'invalid'>('ready');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setEmail(sessionStorage.getItem('niral.verify.email') ?? '');
        setDelivery(sessionStorage.getItem('niral.verify.delivery') ?? '');
      } catch {
        /* Optional storage */
      }
    });
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = useCallback(async () => {
    if (!token || lock.current || statusState === 'success') return;
    lock.current = true;
    setBusy(true);
    setStatusState('verifying');

    try {
      const action = token.startsWith('auth-transition.')
        ? 'confirm-transition'
        : 'verify-email';
      const result = await accountRequest<{ message: string }>(action, { token });
      setMessage(result.message);
      setStatusState('success');
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'This verification link is invalid, expired, or has already been used.',
      );
      setStatusState('invalid');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [token, statusState]);

  useEffect(() => {
    if (statusState !== 'ready') return;
    if (!token?.startsWith('email-verify.')) return;
    const timer = setTimeout(() => void verify(), 100);
    return () => clearTimeout(timer);
  }, [token, verify, statusState]);

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    if (cooldown || lock.current) return;

    if (!email.trim() || !isValidEmail(email)) {
      setMessage('Enter a valid registered email address to resend link.');
      return;
    }

    lock.current = true;
    setBusy(true);

    try {
      const result = await accountRequest<{ message: string }>('resend-verification', {
        email: email.trim().toLowerCase(),
      });
      setMessage(result.message);
      setCooldown(60);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Resend is currently unavailable. Please retry later.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · INBOX CONFIRMATION"
      headlineTitle="Confirm your"
      headlineHighlight="email address."
      description="Verify inbox ownership to activate your account. You can then sign in and manage your hackathon participation."
    >
      <NiralAuthCard
        eyebrow="EMAIL VERIFICATION"
        title={statusState === 'success' ? 'You’re officially in!' : 'Verify your email'}
        subtitle={
          token
            ? 'Confirm this one-time secure link to activate your participant account.'
            : 'Check your inbox for your activation link or request a new one.'
        }
      >
        {statusState === 'success' ? (
          <NiralSuccessState
            title="Email Verified Successfully"
            message={
              message ||
              'Your email has been confirmed. You can now sign in to your NIRAL participant dashboard.'
            }
            primaryAction={{
              label: 'Sign In to Dashboard →',
              href: '/login',
            }}
            secondaryAction={{
              label: 'Complete Profile Setup',
              href: '/profile-completion',
            }}
          />
        ) : (
          <div className={styles.form}>
            {delivery === 'accepted' && !token && (
              <NiralFormAlert
                variant="info"
                message="We dispatched a verification link to your registered email. Check your inbox and spam folder."
              />
            )}

            {token && statusState !== 'invalid' && (
              <PopButton
                className={styles.authSubmitButton}
                onClick={verify}
                disabled={busy}
              >
                {busy
                  ? 'Verifying link…'
                  : token.startsWith('auth-transition.')
                    ? 'Confirm secure account transition'
                    : 'Verify Email Link →'}
              </PopButton>
            )}

            {statusState === 'invalid' && (
              <NiralFormAlert
                variant="error"
                message={message || 'The verification link has expired or is invalid.'}
              />
            )}

            <form onSubmit={handleResend} className={styles.form} style={{ marginTop: 12 }}>
              <NiralTextField
                label="Registered email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <PopButton
                cream
                type="submit"
                className={styles.authSubmitButton}
                disabled={busy || cooldown > 0}
              >
                {cooldown ? `Resend available in ${cooldown}s` : 'Resend Verification Link'}
              </PopButton>
            </form>

            <div className={styles.cardFooterLinks}>
              <Link href="/register">Change email / Return to registration</Link>
              <span>·</span>
              <Link href="/login">Already verified? Sign In</Link>
            </div>
          </div>
        )}
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. ResetExperience                                                         */
/* -------------------------------------------------------------------------- */
export function ResetExperience() {
  const token = useLinkToken();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const lock = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;

    if (!token) {
      setErrorMessage('Open a valid password-reset link before updating your credentials.');
      return;
    }

    const policy = validatePasswordPolicy(password);
    if (policy.length > 0) {
      setErrorMessage(policy[0]);
      return;
    }

    if (password !== confirm) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    lock.current = true;
    setBusy(true);
    setErrorMessage('');

    try {
      await accountRequest<{ message: string; emailDelivery: string }>(
        'reset-password',
        { token, password },
      );
      setSuccess(true);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to reset password. Link may be expired.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · SECURITY"
      headlineTitle="Choose a new"
      headlineHighlight="password."
      description="Protect your participant account with a strong passphrase. All existing sessions will be safely signed out."
    >
      <NiralAuthCard
        eyebrow="PASSWORD RESET"
        title="Reset your password"
        subtitle="Enter a new strong password you have not used on other services."
      >
        {token === null ? (
          <p className={styles.cardSubtitle}>Checking recovery link…</p>
        ) : !token ? (
          <div>
            <NiralFormAlert
              variant="error"
              message="This password reset link is invalid or has already been used. Please request a fresh recovery email."
            />
            <div style={{ marginTop: 20 }}>
              <PopButton href="/forgot-password" className={styles.authSubmitButton}>
                Request New Recovery Link →
              </PopButton>
            </div>
          </div>
        ) : success ? (
          <NiralSuccessState
            title="Password Updated"
            message="Your password was reset successfully. All previous sessions were revoked. You can now sign in with your new password."
            primaryAction={{
              label: 'Sign In with New Password →',
              href: '/login',
            }}
          />
        ) : (
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <NiralFormAlert message={errorMessage} variant="error" />

            <NiralPasswordField
              label="New password"
              autoComplete="new-password"
              placeholder="Create new strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <NiralPasswordStrength password={password} />

            <NiralPasswordField
              label="Confirm new password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <PopButton
              type="submit"
              className={styles.authSubmitButton}
              disabled={busy}
            >
              {busy ? 'Updating password…' : 'Reset Password →'}
            </PopButton>

            <div className={styles.cardFooterLinks}>
              <Link href="/login">Remembered your password? Sign In</Link>
            </div>
          </form>
        )}
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* Re-export RegistrationExperience                                           */
/* -------------------------------------------------------------------------- */
export { NiralRegistrationWizard as RegisterExperience } from './niral-registration-wizard';
