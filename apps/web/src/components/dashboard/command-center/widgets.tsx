"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  ANNOUNCEMENTS,
  DashboardData,
  TaskItem,
  trackDashboardEvent,
  WIDGET_LABELS,
  WidgetId,
  currentPhase,
  greeting,
} from "@/components/dashboard/command-center/hooks";
import { ONBOARDING_CHECKLIST } from "@hackos/shared";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function WelcomeBanner({
  name,
  teamName,
  eventName,
  eventStart,
}: {
  name?: string | null;
  teamName?: string | null;
  eventName: string;
  eventStart: number;
}) {
  const [now, setNow] = useState<number | null>(null);
  const phase = currentPhase();

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = Math.max(eventStart, phase.ends);
  const diff = now ? Math.max(0, target - now) : 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm"
      aria-labelledby="welcome-heading"
    >
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-20" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            Innovation Command Center
          </p>
          <h1
            id="welcome-heading"
            className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]"
          >
            {greeting(name)}
          </h1>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Welcome back to HackOS
            {teamName ? (
              <>
                {" "}
                · Team <span className="font-semibold text-[var(--foreground)]">{teamName}</span>
              </>
            ) : null}
          </p>
          <p className="mt-3 text-xs text-[var(--foreground)]">
            You are participating in{" "}
            <span className="font-semibold text-[var(--primary)]">{eventName}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Current phase ·{" "}
            <span className="font-medium text-[var(--foreground)]">{phase.label}</span>
          </p>
          <p className="mt-3 max-w-lg text-xs leading-relaxed text-[var(--muted)]">
            Keep building — your next mentor review is at 3:00 PM. Ship the next
            milestone and check Today&apos;s Tasks.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--sand-50)] p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Time to next milestone
          </p>
          <div className="mt-3 flex gap-3 font-sans text-2xl font-bold tabular-nums text-[var(--foreground)]">
            <span>{now === null ? "--" : pad(days)}d</span>
            <span>{now === null ? "--" : pad(hours)}h</span>
            <span>{now === null ? "--" : pad(mins)}m</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">{phase.label} ends soon</p>
        </div>
      </div>
    </section>
  );
}

export function ProgressOverview({
  checklist,
  percent,
}: {
  checklist: Record<string, boolean> | null;
  percent: number;
}) {
  const links: Record<string, string> = {
    account: "/dashboard",
    email: "/register/verify",
    profile: "/dashboard/onboarding",
    event: "/dashboard/enrollment",
    team: "/dashboard/team",
    project: "/dashboard/project",
    presentation: "/dashboard/project",
  };

  return (
    <Panel title="Progress Overview" description={`${percent}% complete`}>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {ONBOARDING_CHECKLIST.map((item) => {
          const done = checklist?.[item.key] ?? false;
          return (
            <li key={item.key}>
              <Link
                href={links[item.key] ?? "/dashboard"}
                className="flex items-center gap-2 text-sm hover:text-sky-200"
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
                <span className={done ? "text-emerald-100" : "text-muted"}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function TodaysTasks({
  tasks,
  onToggle,
  onDefer,
}: {
  tasks: TaskItem[];
  onToggle: (id: string) => void;
  onDefer: (id: string) => void;
}) {
  const priorityColor = {
    high: "text-rose-300",
    medium: "text-orange-300",
    low: "text-muted",
  };

  return (
    <Panel title="Today's Tasks" description="Immediate priorities">
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-2xl border border-white/8 bg-black/20 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={`text-sm ${task.done ? "text-muted line-through" : "text-white"}`}
                >
                  {task.title}
                </p>
                <p className="mt-1 text-xs text-muted">
                  <span className={priorityColor[task.priority]}>
                    {task.priority}
                  </span>
                  {" · "}
                  {task.due} · {task.effort}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="sm" variant="secondary" onClick={() => onToggle(task.id)}>
                  {task.done ? "Undo" : "Done"}
                </Button>
                {!task.done ? (
                  <Button size="sm" variant="ghost" onClick={() => onDefer(task.id)}>
                    Defer
                  </Button>
                ) : null}
              </div>
            </div>
            <Link
              href={task.href}
              className="mt-2 inline-block text-xs text-sky-300 hover:underline"
            >
              Open →
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function EventTimeline({ phases }: { phases: Array<{ id: string; label: string; ends: number }> }) {
  const now = Date.now();
  const current = currentPhase();

  return (
    <Panel title="Event Timeline" description="Live hackathon phases">
      <ol className="space-y-3">
        {phases.map((phase) => {
          const done = now > phase.ends;
          const active = current.id === phase.id;
          return (
            <li key={phase.id} className="flex gap-3 text-sm">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  done
                    ? "bg-emerald-400"
                    : active
                      ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                      : "bg-white/20"
                }`}
              />
              <div>
                <p className={active ? "text-sky-100" : done ? "text-muted" : "text-white"}>
                  {phase.label}
                </p>
                <p className="text-xs text-muted">
                  {done
                    ? "Completed"
                    : active
                      ? `Ends ${new Date(phase.ends).toLocaleString()}`
                      : `Scheduled ${new Date(phase.ends).toLocaleDateString()}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function TeamStatusWidget({ team }: { team: DashboardData["team"] }) {
  if (!team) {
    return (
      <Panel title="Team Status" description="No team yet">
        <p className="text-sm text-muted">
          Form or join a squad to unlock shared workspace, chat, and submission.
        </p>
        <Link href="/dashboard/team" className="mt-3 inline-block">
          <Button size="sm">Open team workspace</Button>
        </Link>
      </Panel>
    );
  }

  const xp = team.members.reduce((sum, m) => sum + (m.user.xp ?? 0), 0);

  return (
    <Panel title="Team Status" description={team.theme ?? team.status}>
      <p className="font-display text-lg text-white">{team.name}</p>
      <p className="mt-1 text-xs text-muted">
        Leader · {team.leader?.name ?? "—"} · Mentor{" "}
        {team.mentorId ? "assigned" : "pending"}
      </p>
      <p className="mt-2 font-mono text-xs text-sky-300">Team XP · {xp}</p>
      <ul className="mt-3 space-y-1.5">
        {team.members.map((m) => (
          <li
            key={m.user.id}
            className="flex justify-between text-sm text-muted"
          >
            <span className="text-white">
              {m.user.name}{" "}
              <span className="text-muted">· {m.role}</span>
            </span>
            <span className="font-mono text-xs text-emerald-300/80">●</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/team">
          <Button size="sm">Workspace</Button>
        </Link>
        <Link href="/dashboard/messages">
          <Button size="sm" variant="secondary">
            Team chat
          </Button>
        </Link>
        <Link href="/dashboard/project">
          <Button size="sm" variant="ghost">
            Files
          </Button>
        </Link>
      </div>
    </Panel>
  );
}

export function AnnouncementsWidget() {
  const [acked, setAcked] = useState<string[]>([]);

  useEffect(() => {
    try {
      setAcked(
        JSON.parse(localStorage.getItem("hackos.announcements.ack") ?? "[]"),
      );
    } catch {
      /* ignore */
    }
  }, []);

  function ack(id: string) {
    setAcked((prev) => {
      const next = [...new Set([...prev, id])];
      localStorage.setItem("hackos.announcements.ack", JSON.stringify(next));
      return next;
    });
  }

  const sorted = [...ANNOUNCEMENTS].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });

  return (
    <Panel title="Live Announcements" description="Organizer updates">
      <ul className="space-y-3">
        {sorted.map((a) => {
          const pinned = a.priority === "high" && !acked.includes(a.id);
          return (
            <li
              key={a.id}
              className={`rounded-2xl border p-3 ${
                pinned
                  ? "border-orange-400/30 bg-orange-500/10"
                  : "border-white/8 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-white">{a.title}</p>
                <span className="font-mono text-[10px] uppercase text-muted">
                  {a.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{a.summary}</p>
              <p className="mt-1 font-mono text-[10px] text-sky-300/70">{a.at}</p>
              {pinned ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => ack(a.id)}
                >
                  Acknowledge
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function NotificationsWidget({
  items,
}: {
  items: DashboardData["notifications"];
}) {
  const categories = [
    "Team",
    "Mentors",
    "Quizzes",
    "Games",
    "Project",
    "Event",
    "Certificates",
    "Security",
  ];
  const [filter, setFilter] = useState("All");

  return (
    <Panel title="Notifications" description="Deep-linked updates">
      <div className="mb-3 flex flex-wrap gap-1" id="notifications">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] ${
              filter === c
                ? "bg-sky-500/20 text-sky-200"
                : "bg-white/5 text-muted"
            }`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted">
            No notifications yet. Complete onboarding to receive updates.
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id} className="rounded-xl border border-white/8 px-3 py-2">
              {n.link ? (
                <Link href={n.link} className="text-sm text-sky-100 hover:underline">
                  {n.title}
                </Link>
              ) : (
                <p className="text-sm text-white">{n.title}</p>
              )}
              <p className="text-xs text-muted">{n.body}</p>
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}

export function AiSuggestions() {
  return null;
}

export function LeaderboardPreview() {
  const rows = [
    { rank: 1, name: "Quantum Builders", score: 2480 },
    { rank: 2, name: "Edge Nomads", score: 2310 },
    { rank: 3, name: "Your squad", score: 1980, you: true },
    { rank: 4, name: "Sensor Syndicate", score: 1875 },
  ];

  return (
    <Panel title="Leaderboard" description="Live preview">
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
              r.you ? "border border-sky-400/30 bg-sky-500/10" : "bg-black/20"
            }`}
          >
            <span className="text-white">
              #{r.rank} {r.name}
            </span>
            <span className="font-mono text-xs text-sky-300">{r.score}</span>
          </li>
        ))}
      </ul>
      <Link href="/leaderboard" className="mt-3 inline-block text-xs text-sky-300 hover:underline">
        Full leaderboard →
      </Link>
    </Panel>
  );
}

export function CalendarWidget() {
  const events = [
    { title: "Mentor: Embedded Architecture", when: "Today · 15:00", type: "Mentor" },
    { title: "Hardware workshop", when: "Today · 17:00", type: "Workshop" },
    { title: "Prototype checkpoint", when: "Tomorrow · 12:00", type: "Deadline" },
    { title: "Team stand-up", when: "Daily · 10:00", type: "Team" },
  ];

  return (
    <Panel title="Personal Calendar" description="Sessions & deadlines">
      <div id="calendar" />
      <ul className="space-y-2">
        {events.map((e) => (
          <li
            key={e.title}
            className="rounded-xl border border-white/8 bg-black/20 px-3 py-2"
          >
            <p className="text-sm text-white">{e.title}</p>
            <p className="mt-1 font-mono text-[10px] text-muted">
              {e.type} · {e.when}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        External calendar sync coming in a future release.
      </p>
    </Panel>
  );
}

export function QuizGamesProgress() {
  return (
    <Panel title="Quiz & Games" description="Learning momentum">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
          <p className="text-xs text-muted">Daily Quiz</p>
          <p className="mt-1 font-display text-xl text-white">2 / 5</p>
          <Link href="/quiz" className="mt-2 inline-block text-xs text-sky-300">
            Continue →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
          <p className="text-xs text-muted">Mini Games XP</p>
          <p className="mt-1 font-display text-xl text-white">340</p>
          <Link href="/games" className="mt-2 inline-block text-xs text-sky-300">
            Play →
          </Link>
        </div>
      </div>
    </Panel>
  );
}

export function WidgetCustomizeBar({
  hidden,
  onToggle,
  onMove,
  onRestore,
  density,
  onDensity,
  visible,
}: {
  hidden: WidgetId[];
  visible: WidgetId[];
  onToggle: (id: WidgetId) => void;
  onMove: (id: WidgetId, dir: -1 | 1) => void;
  onRestore: () => void;
  density: "comfortable" | "compact";
  onDensity: (v: "comfortable" | "compact") => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        Customize widgets
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const next = density === "comfortable" ? "compact" : "comfortable";
          onDensity(next);
          trackDashboardEvent("widget_density_changed", { density: next });
        }}
      >
        Density · {density}
      </Button>
      {open ? (
        <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs text-muted">
            Show, hide, or reorder widgets. Preferences sync on this device (profile
            sync coming next).
          </p>
          <ul className="mt-3 space-y-2">
            {visible.concat(hidden).filter((v, i, a) => a.indexOf(v) === i).map((id) => (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-white">{WIDGET_LABELS[id]}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onMove(id, -1)}>
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onMove(id, 1)}>
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onToggle(id);
                      trackDashboardEvent("widget_toggled", { widget: id });
                    }}
                  >
                    {hidden.includes(id) ? "Show" : "Hide"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            className="mt-3"
            variant="ghost"
            onClick={() => {
              onRestore();
              trackDashboardEvent("widgets_restored_default");
            }}
          >
            Restore defaults
          </Button>
        </div>
      ) : null}
    </div>
  );
}
