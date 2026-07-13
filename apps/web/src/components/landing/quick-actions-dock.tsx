"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  CalendarDays,
  Globe,
  HelpCircle,
  MessageCircle,
  Moon,
  Sun,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "#leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "#timeline", label: "Schedule", icon: CalendarDays },
  { href: "#faq", label: "Help", icon: HelpCircle },
  { href: "#contact", label: "Chat", icon: MessageCircle },
  { href: "#ai-assistant", label: "AI Assistant", icon: Bot },
];

export function QuickActionsDock() {
  const [expanded, setExpanded] = useState(false);
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <nav
        aria-label="Quick actions"
        className={cn(
          "glass flex items-center gap-1 rounded-full border border-white/15 px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all",
          expanded ? "px-3" : "px-2",
        )}
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sky-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            title={action.label}
          >
            <action.icon className="h-4 w-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap text-xs font-medium transition-all",
                expanded ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0",
              )}
            >
              {action.label}
            </span>
          </Link>
        ))}
        <button
          type="button"
          className="rounded-full p-2 text-sky-100 hover:bg-white/10"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => {
            const next = !dark;
            setDark(next);
            document.documentElement.dataset.theme = next ? "dark" : "light";
          }}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-xs text-sky-100 hover:bg-white/10"
          aria-label={`Language ${lang}`}
          onClick={() => setLang((v) => (v === "EN" ? "HI" : "EN"))}
        >
          <Globe className="h-4 w-4" />
          {expanded ? lang : null}
        </button>
      </nav>
    </div>
  );
}
