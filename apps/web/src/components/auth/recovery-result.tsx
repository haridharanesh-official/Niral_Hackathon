'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '@/components/niral-auth/auth.module.css';
export function RecoveryResult({
  variant,
}: {
  variant: 'requested' | 'changed' | 'expired' | 'invalid' | 'error';
}) {
  const [cooldown, setCooldown] = useState(variant === 'requested' ? 60 : 0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const content = {
    requested: [
      'Check your next step.',
      'If that email matches an account, recovery instructions are on their way. Check your inbox and spam folder.',
    ],
    changed: [
      'Password updated.',
      'Your password was changed successfully. Sign in with your new password.',
    ],
    expired: [
      'This link has expired.',
      'Request a fresh recovery link to choose a new password.',
    ],
    invalid: [
      'Invalid recovery link.',
      'This link is invalid or has already been used. Request another recovery email.',
    ],
    error: [
      'We couldn’t complete recovery.',
      'Your password has not been changed. Try again or request a fresh link.',
    ],
  }[variant];
  return (
    <section className={styles.success} role="status">
      <h2>{content[0]}</h2>
      <p>{content[1]}</p>
      <div className={styles.links}>
        <Link href="/login">Go to sign in</Link>
        {cooldown ? (
          <span>Try again in {cooldown}s</span>
        ) : (
          <Link href="/forgot-password">Try another email / request a new link</Link>
        )}
      </div>
    </section>
  );
}
