import type { Metadata } from 'next';
import { UpdatesPage } from '@/components/niral/updates-page';

export const metadata: Metadata = {
  title: 'Official Updates',
  description:
    'Stay informed with the latest announcements, important dates, and updates from the NIRAL Hackathon 2026 organizing team.',
  alternates: {
    canonical: '/updates',
  },
};

export default function Page() {
  return <UpdatesPage />;
}
