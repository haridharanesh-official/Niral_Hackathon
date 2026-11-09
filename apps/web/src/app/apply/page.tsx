import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Event Application', robots: { index: false, follow: false } };
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ApplicationExperience } from '@/components/niral-auth/application';
export default async function Page(){const session=await auth();if(!session?.accessToken)redirect('/login');if(!['PARTICIPANT','TEAM_LEADER'].includes(session.user.role))redirect('/login/callback');return <ApplicationExperience identity={{name:session.user.name??'',email:session.user.email??'',userId:session.user.id}}/>;}
