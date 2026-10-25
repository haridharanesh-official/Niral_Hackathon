import type { Metadata } from 'next';
import { RulesPage } from '@/components/niral/rules-page';

export const metadata: Metadata = {
  title: 'Rules & Eligibility',
  description:
    'Official rules, eligibility criteria, code of conduct, and participation guidelines for NIRAL Hackathon 2026.',
  alternates: {
    canonical: '/rules',
  },
};

export default function Page() {
  return <RulesPage />;
}
