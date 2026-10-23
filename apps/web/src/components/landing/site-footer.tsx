"use client";

import Link from "next/link";
import { useAppContent } from "@/store/content-context";

export function SiteFooter() {
  const { content } = useAppContent();
  const appName = content?.event?.name || "Niral Hackathon";
  const initial = appName.charAt(0) || "H";

  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--card)] py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white shadow-sm">
            {initial}
          </div>
          <div>
            <p className="font-sans text-base font-bold text-[var(--foreground)]">
              {appName}
            </p>
            <p className="text-xs text-[var(--muted)]">
              DepotNexus inspired theme · Real-time connected systems & innovation challenge.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--muted)]">
          <Link href="/admin/content" className="text-[var(--primary)] font-semibold hover:underline">
            CMS Editor
          </Link>
          <Link href="/api-status" className="hover:text-[var(--foreground)] transition">
            API Status
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--foreground)] transition">
            Dashboard
          </Link>
          <Link href="/login" className="hover:text-[var(--foreground)] transition">
            Sign in
          </Link>
          <a href="#faq" className="hover:text-[var(--foreground)] transition">
            FAQ
          </a>
        </div>
      </div>
    </footer>
  );
}
