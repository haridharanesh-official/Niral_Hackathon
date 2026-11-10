import type { Metadata } from 'next';
import { LoginExperience } from '@/components/niral-auth/auth-forms';

export const metadata: Metadata = {
  title: 'Sign In · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginExperience />;
}
