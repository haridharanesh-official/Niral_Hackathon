import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Verify Email', robots: { index: false, follow: false } };
import { VerifyExperience } from '@/components/niral-auth/auth-forms';
export default function Page() { return <VerifyExperience/>; }
