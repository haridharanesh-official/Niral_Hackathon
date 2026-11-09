import type { Metadata } from 'next';
import { AuthLayout, AuthHeading } from '@/components/niral-auth/auth-layout';
import { PopButton } from '@/components/niral/pop-button';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Session expired',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <AuthLayout story="login">
      <AuthHeading
        eyebrow="Session security"
        title="Your session has ended."
        highlight=""
        subtitle="For your security, sign in again to continue."
      />
      <p>
        Your non-sensitive registration draft can be resumed on this device. Re-enter your
        password after signing in securely.
      </p>
      <p style={{ marginBlock: 24 }}>
        <PopButton href="/login">Sign in again →</PopButton>
      </p>
      <p>
        <Link href="/forgot-password">Recover your account</Link> ·{' '}
        <Link href="/">Return to public site</Link>
      </p>
    </AuthLayout>
  );
}
