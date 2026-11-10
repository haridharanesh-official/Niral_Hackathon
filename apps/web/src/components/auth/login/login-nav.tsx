'use client';

import Link from 'next/link';
import { Logo } from '@/components/niral/public-page-shell';
import { ArrowLeft } from 'lucide-react';

export function LoginNav() {
  return (
    <header className="relative z-20 border-b-2 border-[#111] bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Logo />

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#111] bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#111] shadow-[0_2px_0_#111] transition hover:bg-[#FFE2DB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <Link
            href="/rules"
            className="hidden text-xs font-semibold text-[#111] hover:underline sm:inline-block"
          >
            Rules
          </Link>
          <Link
            href="/schedule"
            className="hidden text-xs font-semibold text-[#111] hover:underline sm:inline-block"
          >
            Schedule
          </Link>
          <Link
            href="/contact"
            className="hidden text-xs font-semibold text-[#111] hover:underline sm:inline-block"
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
