import type { Metadata } from 'next';
import { ParticipatePage } from '@/components/niral/participate-page';

export const metadata: Metadata = {
  title: 'How to Participate',
  description:
    'Step-by-step participation journey, eligibility criteria, and team guidelines for NIRAL Hackathon 2026.',
  alternates: {
    canonical: '/participate',
  },
};

export default function Page() {
  return <ParticipatePage />;
}
