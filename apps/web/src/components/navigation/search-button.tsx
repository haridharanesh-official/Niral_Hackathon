"use client";

import { Search } from "lucide-react";

export function SearchButton() {
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label="Search"
      onClick={() => {
        document.getElementById("themes")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <Search className="h-4 w-4" aria-hidden />
    </button>
  );
}
