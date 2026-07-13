"use client";

import { Globe } from "lucide-react";
import { useHomeUi } from "@/store/home-ui";

export function LanguageSelector() {
  const { lang, toggleLang } = useHomeUi();

  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      aria-label={`Language: ${lang}. Switch language`}
      onClick={toggleLang}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      {lang}
    </button>
  );
}
