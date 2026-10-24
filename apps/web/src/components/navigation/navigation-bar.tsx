"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/navigation/logo";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import {
  LoginButton,
  RegisterButton,
} from "@/components/navigation/auth-buttons";

export function NavigationBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#tracks", label: "Tracks" },
    { href: "#problems", label: "Problem Statements" },
    { href: "#timeline", label: "Schedule" },
    { href: "#rules", label: "Rules" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300 py-2 sm:py-3",
        scrolled
          ? "border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md shadow-[0_2px_12px_rgba(40,30,20,0.04)]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Logo />
        </div>

        {/* Center: Clean Hackathon Navigation Dock */}
        <nav
          aria-label="Hackathon Navigation"
          className="hidden lg:flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card)]/95 px-3 py-1.5 shadow-[0_2px_14px_rgba(60,45,30,0.06)] backdrop-blur-md"
        >
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:text-[var(--primary)] hover:bg-[var(--sand-100)]"
          >
            Home
          </Link>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] hover:bg-[var(--sand-100)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle & Primary CTAs */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2 pl-1">
            <LoginButton />
            <RegisterButton />
          </div>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open ? (
        <div className="border-b border-[var(--card-border)] bg-[var(--card)]/98 px-6 py-5 shadow-xl backdrop-blur-xl lg:hidden animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--sand-100)] transition"
            >
              Home
            </Link>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sand-100)] transition"
              >
                {link.label}
              </a>
            ))}

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--card-border)]">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <LoginButton fullWidth={false} onNavigate={() => setOpen(false)} />
                <RegisterButton fullWidth={false} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** @deprecated Prefer NavigationBar */
export { NavigationBar as SiteHeader };
