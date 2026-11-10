import type { Metadata } from 'next';
import { RegisterExperience } from '@/components/niral-auth/auth-forms';

export const metadata: Metadata = {
  title: 'Create Account · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterExperience />;
}
