import type { Metadata } from 'next';
import { TracksPage } from '@/components/niral/tracks-page';

export const metadata: Metadata = {
  title: 'Innovation Tracks',
  description:
    'Explore focused IoT, AI + Edge, Robotics, Embedded Systems, and Smart Campus tracks at NIRAL Hackathon 2026.',
  alternates: {
    canonical: '/tracks',
  },
};

export default function Page() {
  return <TracksPage />;
}
