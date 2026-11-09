import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProfileCompletion } from '@/components/auth/profile-completion';
export const metadata: Metadata = {
  title: 'Complete profile',
  robots: { index: false, follow: false },
};
export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/profile-completion');
  return <ProfileCompletion />;
}
