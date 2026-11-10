'use client';

import Link from 'next/link';
import { Logo } from '@/components/niral/public-page-shell';
import { cn } from '@/lib/utils';
import React from 'react';

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FFFFFF] px-6 py-12 [background-image:radial-gradient(#dededb_0.65px,transparent_0.65px)] [background-size:23px_23px]">
      <div className={cn('relative z-10 w-full', wide ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="mb-8 flex items-center justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border-2 border-[#111] bg-white p-8 shadow-[0_6px_0_#111]">
          <h1 className="font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight text-[#111]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-[#696969]">
          <Link href="/" className="font-semibold text-[#111] underline hover:text-[#FD9B9B]">
            Return to NIRAL Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
