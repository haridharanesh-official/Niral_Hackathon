import type { Metadata } from 'next';
import { AboutPage } from '@/components/niral/about-page';

export const metadata: Metadata = {
  title: 'About NIRAL',
  description:
    'Learn about NIRAL Hackathon 2026 — an innovation-driven IoT and emerging technologies hackathon at Sri Shakthi Institute of Engineering and Technology.',
  alternates: {
    canonical: '/about',
  },
};

export default function Page() {
  return <AboutPage />;
}
