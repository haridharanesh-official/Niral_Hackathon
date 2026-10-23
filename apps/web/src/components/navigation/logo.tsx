"use client";

import Link from "next/link";
import { useAppContent } from "@/store/content-context";

export function Logo() {
  const { content } = useAppContent();
  const appName = content?.event?.name || "Niral Hackathon";
  const initial = appName.charAt(0) || "H";

  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label={`${appName} home`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white shadow-sm transition group-hover:scale-105">
        {initial}
      </div>
      <div className="flex flex-col">
        <span className="font-sans text-base font-bold tracking-tight text-[var(--foreground)] transition group-hover:text-[var(--primary)]">
          {appName}
        </span>
      </div>
    </Link>
  );
}
