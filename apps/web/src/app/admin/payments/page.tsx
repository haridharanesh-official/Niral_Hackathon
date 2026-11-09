import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MasterPayments } from '@/components/payments/master-payments';
import styles from '@/components/niral/niral.module.css';
export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  return (
    <div className={styles.root} style={{ padding: '32px max(16px, 5vw)' }}>
      <MasterPayments />
    </div>
  );
}
