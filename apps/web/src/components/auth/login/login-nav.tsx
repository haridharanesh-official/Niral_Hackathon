"use client";

import Link from "next/link";
import { APP_NAME } from "@hackos/shared";
import { ArrowLeft, Globe, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const LANG_KEY = "hackos.pref.lang";
const THEME_KEY = "hackos.pref.theme";

export function LoginNav() {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      const isDark = savedTheme === "dark";
      setDark(isDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    }
    if (savedLang === "EN" || savedLang === "HI") setLang(savedLang);
  }, []);

  return (
    <header className="relative z-20 border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="glow-ring flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 font-display text-xs font-bold text-white">
            H
          </div>
          <span className="font-display text-xs font-semibold tracking-[0.2em] text-sky-300">
            {APP_NAME}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-muted transition hover:bg-white/5 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted hover:bg-white/5 hover:text-foreground"
            aria-label={`Language ${lang}`}
            onClick={() => {
              const next = lang === "EN" ? "HI" : "EN";
              setLang(next);
              localStorage.setItem(LANG_KEY, next);
            }}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang}
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-foreground"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.dataset.theme = next ? "dark" : "light";
              localStorage.setItem(THEME_KEY, next ? "dark" : "light");
            }}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
