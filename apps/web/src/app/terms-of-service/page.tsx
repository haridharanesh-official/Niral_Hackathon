import type { Metadata } from 'next';
import { LegalPage } from '@/components/niral/legal-page';
import { termsSections } from '@/components/niral/legal-content';
export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'NIRAL Hackathon 2026 website and participation terms, provided for organizer and legal review.',
  alternates: { canonical: '/terms-of-service' },
};
export default function Page() {
  return (
    <LegalPage
      title="Terms of Service"
      description="Account responsibilities, participation, team workflows and the conditions that still need organizer approval."
      sections={termsSections}
    />
  );
}
