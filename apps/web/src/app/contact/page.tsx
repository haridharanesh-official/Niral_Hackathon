import type { Metadata } from 'next';
import { ContactPage } from '@/components/niral/contact-page';

export const metadata: Metadata = {
  title: 'Contact & Venue',
  description:
    'Contact the NIRAL Hackathon 2026 organizing team and get directions to Sri Shakthi Institute of Engineering and Technology, Coimbatore.',
  alternates: {
    canonical: '/contact',
  },
};

export default function Page() {
  return <ContactPage />;
}
