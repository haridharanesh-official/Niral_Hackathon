import Link from "next/link";
import { APP_NAME } from "@hackos/shared";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label={`${APP_NAME} home`}
    >
      <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 font-display text-sm font-bold text-white">
        H
      </div>
      <span className="font-display text-sm font-semibold tracking-[0.22em] text-sky-300">
        {APP_NAME}
      </span>
    </Link>
  );
}
