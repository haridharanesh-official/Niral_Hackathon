import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Create Account', robots: { index: false, follow: false } };
import { RegisterExperience } from '@/components/niral-auth/auth-forms';
export default function Page() { return <RegisterExperience/>; }
