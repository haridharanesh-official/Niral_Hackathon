"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/navigation/logo";
import { NavigationLinks, NAV_LINKS } from "@/components/navigation/navigation-links";
import { SearchButton } from "@/components/navigation/search-button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LanguageSelector } from "@/components/navigation/language-selector";
import {
  LoginButton,
  RegisterButton,
} from "@/components/navigation/auth-buttons";

export function NavigationBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#05070f]/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Logo />
        <NavigationLinks />
        <div className="hidden items-center gap-1 md:flex">
          <SearchButton />
          <LanguageSelector />
          <ThemeToggle />
          <LoginButton />
          <RegisterButton />
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-white/5 bg-[#05070f]/95 px-6 py-4 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-sm text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <SearchButton />
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <LoginButton fullWidth onNavigate={() => setOpen(false)} />
          <RegisterButton fullWidth onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
}

/** @deprecated Prefer NavigationBar */
export { NavigationBar as SiteHeader };
