import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Account Recovery', robots: { index: false, follow: false } };
import { ForgotExperience } from '@/components/niral-auth/auth-forms';
export default function Page() { return <ForgotExperience/>; }
