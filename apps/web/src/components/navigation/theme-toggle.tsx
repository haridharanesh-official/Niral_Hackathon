"use client";

import { Moon, Sun } from "lucide-react";
import { useHomeUi } from "@/store/home-ui";

export function ThemeToggle() {
  const { dark, toggleDark } = useHomeUi();

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleDark}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
