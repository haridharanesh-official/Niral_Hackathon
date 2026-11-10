import type { Metadata } from 'next';
import { VerifyExperience } from '@/components/niral-auth/auth-forms';

export const metadata: Metadata = {
  title: 'Verify Email · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return <VerifyExperience />;
}
