import { auth } from '@/auth';
import { redirect } from 'next/navigation';
export default async function Page(){const session=await auth();if(!session?.user)redirect('/login');if(session.user.role!=='ORGANIZER')redirect('/dashboard');redirect('/dashboard/organizer');}
