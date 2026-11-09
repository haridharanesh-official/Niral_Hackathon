import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sign In', robots: { index: false, follow: false } };
import { LoginExperience } from '@/components/niral-auth/auth-forms';
export default function Page() { return <LoginExperience/>; }
