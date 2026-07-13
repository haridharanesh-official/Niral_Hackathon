import Link from "next/link";
import { APP_NAME } from "@hackos/shared";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm tracking-[0.22em] text-sky-300">
            {APP_NAME}
          </p>
          <p className="mt-1 text-sm text-muted">
            We are building the future — one team, one demo, one weekend at a time.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted">
          <Link href="/api-status" className="hover:text-sky-300">
            Status
          </Link>
          <Link href="/login" className="hover:text-sky-300">
            Sign in
          </Link>
          <a href="#faq" className="hover:text-sky-300">
            FAQ
          </a>
        </div>
      </div>
    </footer>
  );
}
