"use client";

import { Search } from "lucide-react";

export function SearchButton() {
  const handleClick = () => {
    const el = document.getElementById("themes") || document.getElementById("leaderboard");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex h-9 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 text-xs text-[var(--muted)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label="Search order, challenge or product"
    >
      <Search className="h-3.5 w-3.5 text-[var(--muted)] group-hover:text-[var(--primary)]" aria-hidden />
      <span className="hidden xl:inline text-stone-500">Search order or product…</span>
      <span className="hidden sm:inline xl:hidden text-stone-500">Search…</span>
      <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--card-border)] bg-[var(--sand-100)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
        ⌘K
      </kbd>
    </button>
  );
}
