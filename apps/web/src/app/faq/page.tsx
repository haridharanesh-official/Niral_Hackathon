import type { Metadata } from 'next';
import { FaqPage } from '@/components/niral/faq-page';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about eligibility, registration, teams, tracks, logistics and prizes for NIRAL Hackathon 2026.',
  alternates: {
    canonical: '/faq',
  },
};

export default function Page() {
  return <FaqPage />;
}
