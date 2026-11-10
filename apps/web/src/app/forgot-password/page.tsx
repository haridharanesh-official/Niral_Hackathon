import type { Metadata } from 'next';
import { ForgotExperience } from '@/components/niral-auth/auth-forms';

export const metadata: Metadata = {
  title: 'Forgot Password · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotExperience />;
}
