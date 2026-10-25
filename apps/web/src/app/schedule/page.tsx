import type { Metadata } from 'next';
import { SchedulePage } from '@/components/niral/schedule-page';

export const metadata: Metadata = {
  title: 'Event Schedule',
  description:
    'Complete two-day schedule, timeline, workshops and finale details for NIRAL Hackathon 2026 (December 3–4, 2026).',
  alternates: {
    canonical: '/schedule',
  },
};

export default function Page() {
  return <SchedulePage />;
}
