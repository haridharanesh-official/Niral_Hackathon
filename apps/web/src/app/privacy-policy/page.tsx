import type { Metadata } from 'next';
import { LegalPage } from '@/components/niral/legal-page';
import { privacySections } from '@/components/niral/legal-content';
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'NIRAL Hackathon 2026 privacy notice: organizer review draft covering accounts, registration, teams and payment reconciliation.',
  alternates: { canonical: '/privacy-policy' },
};
export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How the NIRAL website handles participant information, account access and authorized payment reconciliation."
      sections={privacySections}
    />
  );
}
