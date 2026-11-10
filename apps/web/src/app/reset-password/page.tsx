import type { Metadata } from 'next';
import { ResetExperience } from '@/components/niral-auth/auth-forms';

export const metadata: Metadata = {
  title: 'Reset Password · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetExperience />;
}
