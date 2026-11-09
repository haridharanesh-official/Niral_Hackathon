import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Reset Password', robots: { index: false, follow: false } };
import { ResetExperience } from '@/components/niral-auth/auth-forms';
export default function Page() { return <ResetExperience/>; }
