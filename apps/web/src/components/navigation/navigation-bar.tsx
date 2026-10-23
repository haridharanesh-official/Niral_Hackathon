"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Headphones,
  Home,
  LayoutGrid,
  Lightbulb,
  Link2,
  Menu,
  MessageSquare,
  Settings,
  Truck,
  Wrench,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/navigation/logo";
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
  const [activeTab, setActiveTab] = useState<string>("order-history");
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pillTools = [
    { id: "tools", href: "#themes", icon: Wrench, label: "Builders & Tools" },
    { id: "links", href: "#resources", icon: Link2, label: "Resources & Docs" },
    { id: "shipping", href: "#timeline", icon: Truck, label: "Shipping & Delivery" },
    { id: "gallery", href: "#gallery", icon: LayoutGrid, label: "Projects & Gallery" },
    { id: "chat", href: "#contact", icon: MessageSquare, label: "Community & Chat" },
    { id: "ideas", href: "#faq", icon: Lightbulb, label: "FAQ & Innovation" },
    { id: "support", href: "#contact", icon: Headphones, label: "24/7 Mentor Support" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300 py-2 sm:py-3",
        scrolled
          ? "border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md shadow-[0_2px_12px_rgba(40,30,20,0.03)]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Logo />
        </div>

        {/* Center: DepotNexus Floating Pill Navigation Bar */}
        <nav
          aria-label="Floating Navigation Dock"
          className="hidden lg:flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card)]/95 px-2 py-1.5 shadow-[0_2px_14px_rgba(60,45,30,0.06)] backdrop-blur-md"
        >
          {/* Home Icon */}
          <Link
            href="/"
            aria-label="Home"
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--foreground)] hover:bg-[var(--sand-100)]",
              activeTab === "home" && "text-[var(--primary)]",
            )}
          >
            <Home className="h-4 w-4" />
          </Link>

          {/* Active DepotNexus Terracotta Pill */}
          <Link
            href="#leaderboard"
            onClick={() => setActiveTab("order-history")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm",
              activeTab === "order-history"
                ? "bg-[var(--primary)] text-white"
                : "bg-transparent text-[var(--foreground)] hover:bg-[var(--sand-100)]",
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Order History</span>
          </Link>

          {/* Quick Tool Icons with DepotNexus Tooltips */}
          {pillTools.map((tool) => {
            const Icon = tool.icon;
            const isHovered = hoveredIcon === tool.id;
            return (
              <div key={tool.id} className="relative">
                <a
                  href={tool.href}
                  onMouseEnter={() => setHoveredIcon(tool.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--foreground)] hover:bg-[var(--sand-100)]"
                  aria-label={tool.label}
                >
                  <Icon className="h-4 w-4" />
                </a>

                {/* Dark Floating Tooltip like DepotNexus 'Shipping & Delivery' */}
                {isHovered ? (
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1C1917] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg animate-in fade-in zoom-in-95">
                    {tool.label}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#1C1917]" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Right: Search, Utilities, Avatar & Auth */}
        <div className="flex items-center gap-2">
          <SearchButton />

          <div className="hidden sm:flex items-center gap-1.5">
            {/* Settings button */}
            <Link
              href="/dashboard/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition hover:text-[var(--foreground)] hover:border-stone-400"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Notification bell with badge dot */}
            <Link
              href="/dashboard"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition hover:text-[var(--foreground)] hover:border-stone-400"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-white" />
            </Link>

            {/* User Profile Avatar (Mustard/amber circle badge like reference screenshot) */}
            <Link
              href="/dashboard"
              aria-label="User Account"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#FBBF24] text-xs font-bold text-stone-900 shadow-sm transition hover:scale-105 ring-1 ring-[var(--card-border)] overflow-hidden"
            >
              <span className="select-none">👤</span>
            </Link>

            <ThemeToggle />
            <LanguageSelector />
          </div>

          <div className="hidden md:flex items-center gap-2 pl-1">
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Navigation
              </span>
            </div>
            <a
              href="#leaderboard"
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white shadow-sm"
              onClick={() => setOpen(false)}
            >
              <FileText className="h-4 w-4" />
              <span>Order History / Leaderboard</span>
            </a>
            {pillTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.id}
                  href={tool.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--sand-100)] transition"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4 text-[var(--muted)]" />
                  <span>{tool.label}</span>
                </a>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSelector />
              </div>
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
