'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { dashboardPathForRole } from '@/components/auth/login/login-utils';
import { recordLoginSession } from '@/components/auth/login/session-tracker';
import { Logo } from '@/components/niral/public-page-shell';

export default function LoginCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      recordLoginSession();
      router.replace(dashboardPathForRole(session.user.role));
    })();
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-6 [background-image:radial-gradient(#dededb_0.65px,transparent_0.65px)] [background-size:23px_23px]">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-2xl border-2 border-[#111] bg-white p-8 text-center shadow-[0_6px_0_#111]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#111] bg-[#FD9B9B] shadow-[0_2px_0_#111]">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
        </div>
        <p className="font-['Space_Grotesk'] text-xl font-bold text-[#111]">Signing you in…</p>
        <p className="mt-2 text-sm text-[#696969]">
          Verifying session credentials and routing to your workspace.
        </p>
      </div>
    </div>
  );
}
