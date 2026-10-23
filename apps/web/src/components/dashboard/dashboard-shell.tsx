"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  CircuitBoard,
  Cpu,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  Trophy,
  Users,
  X,
  Award,
  FolderKanban,
  FileCheck,
  Gavel,
  UserRound,
} from "lucide-react";
import { APP_NAME, UserRole } from "@hackos/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SIDEBAR = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/team", label: "Team Workspace", icon: Users, badgeKey: "team" },
  { href: "/dashboard/project", label: "Project", icon: FolderKanban },
  { href: "/dashboard/submission", label: "Submission", icon: FileCheck, roles: ["PARTICIPANT", "TEAM_LEADER", "ORGANIZER", "ADMIN"] },
  { href: "/dashboard/judge", label: "Judge Panel", icon: Gavel, roles: ["JUDGE", "ORGANIZER", "ADMIN"] },
  { href: "/dashboard/hardware", label: "Hardware Booking", icon: CircuitBoard },
  { href: "/quiz", label: "Quiz Arena", icon: Trophy },
  { href: "/games", label: "Mini Games", icon: Gamepad2 },
  { href: "/dashboard/resources", label: "Learning Hub", icon: BookOpen },
  { href: "/dashboard/mentor", label: "Mentor Sessions", icon: CalendarDays },
  { href: "/leaderboard", label: "Leaderboards", icon: Award },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

const THEME_KEY = "hackos.pref.theme";
const LANG_KEY = "hackos.pref.lang";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState("EN");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [awaitingGo, setAwaitingGo] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem(THEME_KEY);
    const savedLang = localStorage.getItem(LANG_KEY);
    if (theme === "light" || theme === "dark") {
      setDark(theme === "dark");
      document.documentElement.dataset.theme = theme;
    }
    if (savedLang) setLang(savedLang);
  }, []);

  const initials = useMemo(() => {
    const name = session?.user?.name ?? "P";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [session?.user?.name]);

  const userRole = (session?.user?.role as UserRole | undefined) ?? UserRole.PARTICIPANT;

  const navItems = useMemo(
    () =>
      SIDEBAR.filter(
        (item) =>
          !("roles" in item) ||
          !item.roles ||
          (item.roles as readonly string[]).includes(userRole),
      ),
    [userRole],
  );

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const recent = JSON.parse(
      localStorage.getItem("hackos.search.recent") ?? "[]",
    ) as string[];
    localStorage.setItem(
      "hackos.search.recent",
      JSON.stringify([q, ...recent.filter((x) => x !== q)].slice(0, 8)),
    );
    router.push(`/dashboard?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";
      if (typing) return;

      if (event.key === "/") {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[aria-label="Dashboard search"]',
        );
        input?.focus();
        return;
      }

      if (awaitingGo) {
        setAwaitingGo(false);
        if (event.key.toLowerCase() === "t") {
          router.push("/dashboard/team");
        } else if (event.key.toLowerCase() === "d") {
          router.push("/dashboard");
        }
        return;
      }

      if (event.key.toLowerCase() === "g") {
        setAwaitingGo(true);
        window.setTimeout(() => setAwaitingGo(false), 1100);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [awaitingGo, router]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top navigation — fixed */}
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)] lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] font-sans text-xs font-bold text-white shadow-sm">
              H
            </div>
            <span className="hidden font-sans text-sm font-bold tracking-tight text-[var(--foreground)] sm:inline">
              {APP_NAME}
            </span>
          </Link>

          <form
            onSubmit={runSearch}
            className="relative mx-auto hidden min-w-0 flex-1 max-w-md md:block"
            role="search"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, mentors, resources…"
              className="field-input h-9 w-full pl-9 text-xs"
              aria-label="Dashboard search"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)] md:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard#notifications"
              className="relative rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-white" />
            </Link>
            <Link
              href="/dashboard/messages"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)]"
              aria-label="Messages"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard#calendar"
              className="hidden rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)] sm:inline-flex"
              aria-label="Calendar"
            >
              <CalendarDays className="h-4 w-4" />
            </Link>
            <Link
              href="/ai"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)]"
              aria-label="AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="rounded-full px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:bg-[var(--sand-100)]"
              aria-label={`Language ${lang}`}
              onClick={() => {
                const next = lang === "EN" ? "HI" : "EN";
                setLang(next);
                localStorage.setItem(LANG_KEY, next);
              }}
            >
              {lang}
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--sand-100)]"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => {
                const next = !dark;
                setDark(next);
                const theme = next ? "dark" : "light";
                document.documentElement.dataset.theme = theme;
                localStorage.setItem(THEME_KEY, theme);
              }}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="relative group">
              <button
                type="button"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FBBF24] text-[11px] font-bold text-stone-900 ring-2 ring-white shadow-sm"
                aria-label="Profile menu"
              >
                {initials}
              </button>
              <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]"
                >
                  <UserRound className="h-4 w-4" /> Profile
                </Link>
                <Link
                  href="/dashboard/security"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]"
                >
                  <Shield className="h-4 w-4" /> Security
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)] cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
        {searchOpen ? (
          <form onSubmit={runSearch} className="border-t border-[var(--card-border)] px-3 py-2 md:hidden">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="field-input h-9 w-full text-xs"
            />
          </form>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[15.5rem_1fr]">
        {/* Mobile drawer backdrop */}
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--card-border)] bg-[var(--card)] pt-14 transition-transform lg:static lg:z-0 lg:w-auto lg:translate-x-0 lg:pt-0 shadow-sm",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 lg:hidden">
            <p className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Navigation
            </p>
            <button
              type="button"
              className="rounded-full p-2 text-[var(--muted)]"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="hidden px-5 pt-4 font-sans text-xs font-bold uppercase tracking-wider text-[var(--muted)] lg:block">
            Workspace
          </p>
          <nav className="space-y-1 px-3 py-3" aria-label="Primary">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs font-medium transition",
                    active
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto hidden border-t border-[var(--card-border)] p-4 lg:block">
            <p className="truncate text-xs font-bold text-[var(--foreground)]">{session?.user?.name}</p>
            <p className="truncate text-[11px] text-[var(--muted)]">{session?.user?.role}</p>
          </div>
        </aside>

        <div className="relative min-h-[calc(100vh-3.5rem)]">
          <div className="pointer-events-none absolute inset-0 circuit-grid opacity-20" />
          <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="relative z-10 border-t border-[var(--card-border)] px-6 py-4 text-center text-xs text-[var(--muted)]">
            {APP_NAME} · Innovation Hub · Built with DepotNexus theme
          </footer>
        </div>
      </div>
    </div>
  );
}
