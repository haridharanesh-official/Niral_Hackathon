import type { Metadata } from 'next';
import { AccountRecoveryForm } from '@/components/auth/account-recovery-form';

export const metadata: Metadata = {
  title: 'Account Recovery · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function AccountRecoveryPage() {
  return <AccountRecoveryForm />;
}
