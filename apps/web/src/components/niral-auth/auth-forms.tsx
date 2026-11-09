'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { validatePasswordPolicy } from '@hackos/shared';
import { PopButton } from '@/components/niral/pop-button';
import { AuthHeading, AuthLayout } from './auth-layout';
import { TactileField, PasswordStrength, emailError } from './form-controls';
import { accountRequest } from './account-api';
import styles from './auth.module.css';
import { RecoveryResult } from '@/components/auth/recovery-result';
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
export function LoginExperience() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const lock = useRef(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem('niral.login.email');
        if (saved) {
          setEmail(saved);
          setRemember(true);
        }
      } catch {
        /* Optional preference. */
      }
    });
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    const next = {
      email: emailError(email),
      password: password ? '' : 'Enter your password.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        const code = result.code;
        setMessage(
          code === 'email_unverified'
            ? 'Verify your email before signing in. Use the verification link or request another below.'
            : code === 'security_transition_required'
              ? 'Check your inbox for a secure account transition link. Confirm it before signing in.'
              : code === 'rate_limited'
                ? 'Too many sign-in attempts. Wait a minute and retry.'
                : code === 'service_unavailable'
                  ? 'Sign-in is temporarily unavailable. Please try again later.'
                  : 'The email or password is incorrect, or this account is unavailable.',
        );
        return;
      }
      try {
        if (remember) localStorage.setItem('niral.login.email', email.trim());
        else localStorage.removeItem('niral.login.email');
      } catch {
        /* Optional preference. */
      }
      const session = await getSession();
      if (!session?.user)
        throw Error('Your session could not be established. Please retry.');
      const next = new URLSearchParams(location.search).get('next');
      router.replace(
        next === '/profile-completion' || next === '/invite'
          ? next
          : (roleDestinations[session.user.role] ?? '/dashboard'),
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in is unavailable.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story="login"
      status={busy ? 'Submitting sign-in' : message || 'Waiting for your credentials'}
    >
      <AuthHeading
        eyebrow="Welcome back"
        title="Welcome back, builder."
        highlight=""
        subtitle="Sign in to your NIRAL participant workspace."
      />
      <form className={styles.form} noValidate onSubmit={submit}>
        <TactileField
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors((v) => ({ ...v, email: emailError(email) }))}
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@example.com"
          error={errors.email}
        />
        <TactileField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          password
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember my email on this device (optional)</span>
        </label>
        {message && (
          <p role="alert" className={styles.notice}>
            {message}
          </p>
        )}
        <PopButton className={styles.submit} type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In →'}
        </PopButton>
      </form>
      <div className={styles.links}>
        <Link href="/forgot-password">Forgot password?</Link>
        <span>·</span>
        <Link href="/register">Create account</Link>
        <Link href="/verify-email">Verify email</Link>
      </div>
      <p className={styles.hint} style={{ marginTop: 24 }}>
        Google sign-in is unavailable until its backend identity integration is verified.
      </p>
    </AuthLayout>
  );
}
export { RegistrationExperience as RegisterExperience } from '@/components/auth/register/v3-registration';
export function ForgotExperience() {
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 60000);
    return () => clearTimeout(timer);
  }, [message]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    setMessage('');
    setError(emailError(email));
    if (emailError(email)) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await accountRequest<{ message: string }>('forgot-password', {
        email: email.trim().toLowerCase(),
      });
      void result;
      setMessage(
        'If that email matches an account, recovery instructions are on their way.',
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Recovery is unavailable.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story="forgot"
      status={busy ? 'Requesting recovery' : message || 'Waiting for your email'}
    >
      <AuthHeading
        eyebrow="Account recovery"
        title="Forgot your password?"
        highlight=""
        subtitle="We’ll help you get back to building. If an account exists, recovery instructions will be sent."
      />
      <form noValidate className={styles.form} onSubmit={submit}>
        <TactileField
          label="Registered email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          error={error}
        />
        {message && <RecoveryResult variant="requested" />}
        <PopButton className={styles.submit} type="submit" disabled={busy || !!message}>
          {busy ? 'Requesting…' : 'Send Recovery Email →'}
        </PopButton>
      </form>
      <p className={styles.links}>
        <Link href="/login">Back to Sign In</Link>
      </p>
    </AuthLayout>
  );
}
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
    if (value) history.replaceState(null, '', window.location.pathname);
    queueMicrotask(() => setToken(value));
  }, []);
  return token;
}
export function VerifyExperience() {
  const token = useLinkToken();
  const [email, setEmail] = useState(''),
    [delivery, setDelivery] = useState(''),
    [state, setState] = useState('ready'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setEmail(sessionStorage.getItem('niral.verify.email') ?? '');
        setDelivery(sessionStorage.getItem('niral.verify.delivery') ?? '');
      } catch {
        /* Storage is optional. */
      }
    });
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const verify = useCallback(async () => {
    if (!token || lock.current || state === 'success') return;
    lock.current = true;
    setBusy(true);
    try {
      const action = token.startsWith('auth-transition.')
        ? 'confirm-transition'
        : 'verify-email';
      const result = await accountRequest<{ message: string }>(action, { token });
      setMessage(result.message);
      setState('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Link could not be verified.');
      setState('invalid');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [token, state]);
  useEffect(() => {
    if (state !== 'ready') return;
    if (!token?.startsWith('email-verify.')) return;
    const timer = setTimeout(() => void verify(), 0);
    return () => clearTimeout(timer);
  }, [token, verify, state]);
  async function resend(e: FormEvent) {
    e.preventDefault();
    if (cooldown || lock.current) return;
    if (emailError(email)) {
      setMessage(emailError(email));
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please retry later.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story="verify"
      status={
        busy
          ? 'Checking your request'
          : state === 'success'
            ? 'Server confirmed verification'
            : message || 'Waiting for your verification link'
      }
    >
      <AuthHeading
        eyebrow="Verify your email"
        title={state === 'success' ? 'You’re officially in.' : 'Check your inbox.'}
        highlight=""
        subtitle={
          token
            ? 'Confirm this one-time email link to continue. No code is needed.'
            : 'Verify ownership of your inbox before signing in.'
        }
      />
      {email && (
        <p className={styles.hint}>
          Registration email: {email.slice(0, 1)}•••@{email.split('@')[1]}
        </p>
      )}
      {state === 'success' ? (
        <div className={styles.success}>
          <p role="status">{message}</p>
          <ul>
            <li>Account email confirmed</li>
            <li>Profile setup available</li>
            <li>Create or join a team after sign-in</li>
          </ul>
          <p className={styles.hint}>
            Email verification confirms inbox ownership. Event eligibility approval
            remains separate.
          </p>
          <div className={styles.actions} style={{ marginTop: 20 }}>
            <PopButton href="/login">Sign In →</PopButton>
            <PopButton href="/profile-completion" cream>
              Continue to profile setup
            </PopButton>
          </div>
        </div>
      ) : (
        <>
          {delivery === 'accepted' && !token && (
            <p className={styles.notice}>
              The email server accepted your verification message. Check your inbox and
              spam folder.
            </p>
          )}
          {delivery === 'failed' && !token && (
            <p className={styles.notice}>
              Your account was created, but the verification email could not be sent.
              Request another link below.
            </p>
          )}
          {token && state !== 'invalid' && (
            <PopButton className={styles.submit} onClick={verify} disabled={busy}>
              {busy
                ? 'Verifying…'
                : token.startsWith('auth-transition.')
                  ? 'Confirm secure account transition'
                  : 'Verify Email →'}
            </PopButton>
          )}
          {state === 'invalid' && (
            <h2 style={{ fontSize: 22 }}>Invalid, expired or used link</h2>
          )}
          {message && (
            <p className={styles.notice} role="status" style={{ marginBlock: 20 }}>
              {message}
            </p>
          )}
          <form className={styles.form} onSubmit={resend} style={{ marginTop: 24 }}>
            <TactileField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <PopButton cream type="submit" disabled={busy || cooldown > 0}>
              {cooldown ? `Resend available in ${cooldown}s` : 'Resend Verification Link'}
            </PopButton>
          </form>
          <div className={styles.links}>
            <a href="mailto:">Open Email</a>
            <Link href="/register">Change Email / Return to Registration</Link>
            <Link href="/login">Sign In</Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
export function ResetExperience() {
  const token = useLinkToken();
  const [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false),
    [message, setMessage] = useState('');
  const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (!token) {
      setMessage('Open a valid recovery link before resetting your password.');
      return;
    }
    const policy = validatePasswordPolicy(password);
    if (policy.length || password !== confirm) {
      setMessage(policy[0] ?? 'Passwords must match.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const result = await accountRequest<{ message: string; emailDelivery: string }>(
        'reset-password',
        { token, password },
      );
      setSuccess(true);
      setPassword('');
      setConfirm('');
      setMessage(
        result.message +
          (result.emailDelivery === 'failed'
            ? ' The password-change notification could not be sent.'
            : ''),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reset unavailable.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story="reset"
      status={
        success
          ? 'Server confirmed password reset'
          : busy
            ? 'Saving new password'
            : message || 'Waiting for recovery link'
      }
    >
      <AuthHeading
        eyebrow="Password recovery"
        title="Choose a new password."
        highlight=""
        subtitle="Use a strong password you have not used before."
      />
      {token === null ? (
        <p>Checking recovery link…</p>
      ) : !token ? (
        <div className={styles.notice}>
          <RecoveryResult variant="invalid" />
        </div>
      ) : success ? (
        <div className={styles.success}>
          <RecoveryResult variant="changed" />
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <TactileField
            label="New password"
            password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            maxLength={128}
          />
          <PasswordStrength password={password} />
          <TactileField
            label="Confirm new password"
            password
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            maxLength={128}
          />
          {message && (
            <p className={styles.notice} role="alert">
              {message} <Link href="/forgot-password">Request another link</Link>
            </p>
          )}
          <PopButton className={styles.submit} type="submit" disabled={busy}>
            {busy ? 'Updating password…' : 'Reset Password →'}
          </PopButton>
        </form>
      )}
    </AuthLayout>
  );
}
