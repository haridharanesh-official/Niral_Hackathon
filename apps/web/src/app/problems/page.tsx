import type { Metadata } from 'next';
import { ProblemsPage } from '@/components/niral/problems-page';

export const metadata: Metadata = {
  title: 'Problem Statements',
  description:
    'Explore challenges, problem statements and domain problem categories at NIRAL Hackathon 2026.',
  alternates: {
    canonical: '/problems',
  },
};

export default function Page() {
  return <ProblemsPage />;
}
