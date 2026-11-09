import type { Metadata } from 'next';
import { auth } from '@/auth';
import { InvitationAcceptance } from '@/components/auth/invitation-acceptance';
export const metadata: Metadata = {
  title: 'Team invitation',
  robots: { index: false, follow: false },
};
export default async function Page() {
  const session = await auth();
  return <InvitationAcceptance authenticated={!!session?.user} />;
}
