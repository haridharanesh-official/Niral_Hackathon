"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Award,
  ClipboardCheck,
  Cpu,
  Gavel,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Trophy,
  Users,
  UserRound,
  CalendarDays,
  QrCode,
  BarChart3,
} from "lucide-react";
import { APP_NAME } from "@hackos/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/mentor", label: "Mentor", icon: CalendarDays },
  { href: "/dashboard/judge", label: "Judge", icon: Gavel },
  { href: "/dashboard/volunteer", label: "Volunteer", icon: QrCode },
  { href: "/dashboard/organizer", label: "Organizer", icon: BarChart3 },
  { href: "/dashboard/achievements", label: "Achievements", icon: Award },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/quiz", label: "Quiz Arena", icon: Trophy },
  { href: "/games", label: "Mini Games", icon: Cpu },
  { href: "/leaderboard", label: "Leaderboard", icon: ClipboardCheck },
  { href: "/ai", label: "AI Lab", icon: Award },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-white/5 bg-[#070b16]/90 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 font-display text-sm font-bold text-white">
            H
          </div>
          <div>
            <p className="font-display text-xs tracking-[0.2em] text-sky-300">
              {APP_NAME}
            </p>
            <p className="text-[11px] text-muted">Ops Console</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-3 lg:pb-6">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition",
                  active
                    ? "bg-sky-500/15 text-sky-200"
                    : "text-muted hover:bg-white/5 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-white/5 p-4 lg:block">
          <p className="truncate text-sm text-white">{session?.user?.name}</p>
          <p className="truncate text-xs text-muted">{session?.user?.role}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 circuit-grid opacity-25" />
        <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
