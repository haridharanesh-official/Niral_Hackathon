"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  FileUp,
  MessageSquare,
  Sparkles,
  Video,
  CalendarPlus,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/components/dashboard/command-center/hooks";
import {
  ACTIVITY_FEED,
  BADGES,
  DAILY_CHALLENGE,
  PROJECT_HEALTH,
  RESOURCE_RECS,
  SMART_NOTIFS,
  XP_TODAY,
  buildAiSuggestions,
  buildRecommendations,
  memberPersona,
} from "@/components/dashboard/command-center/intelligence";

export function AiSmartWorkspace({
  data,
  name,
}: {
  data: DashboardData;
  name?: string | null;
}) {
  const suggestions = useMemo(
    () => buildAiSuggestions(data, name),
    [data, name],
  );
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function ask(preset?: string) {
    const q = (preset ?? prompt).trim();
    if (!q) return;
    setBusy(true);
    setReply(null);
    // Contextual stub — references event / phase without blocking UI
    window.setTimeout(() => {
      setReply(
        `For ${suggestions.context} (${suggestions.phase}): ${q}\n\n` +
          `1) Align the deliverable with your team theme.\n` +
          `2) Check Learning Hub resources tagged for this phase.\n` +
          `3) Book a 20-min mentor slot if you are blocked.\n\n` +
          `Ask follow-ups anytime — full model routing lives in AI Lab.`,
      );
      setBusy(false);
    }, 350);
  }

  return (
    <section
      className="glass relative overflow-hidden rounded-3xl border border-violet-400/25 p-5 sm:p-6"
      aria-labelledby="ai-workspace-title"
    >
      <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-300" aria-hidden />
          <h2
            id="ai-workspace-title"
            className="font-display text-lg font-semibold text-white"
          >
            AI Smart Workspace
          </h2>
        </div>
        <p className="mt-3 text-sm text-white">{suggestions.greeting}!</p>
        <p className="mt-1 text-sm text-muted">
          Based on your progress in {suggestions.context}, here are my
          suggestions:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-violet-50">
          {suggestions.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => ask("Help me complete my proposal")}>
            Ask AI
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => ask("Generate project ideas for our theme")}
          >
            Generate Ideas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => ask("Summarize the hackathon rules and judging criteria")}
          >
            Summarize Rules
          </Button>
          <Link href="/ai">
            <Button size="sm" variant="ghost">
              Open AI Lab
            </Button>
          </Link>
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input
            className="field-input flex-1 text-sm"
            placeholder="Ask about hardware, MQTT, judging, teammates…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            aria-label="Ask AI"
          />
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "…" : "Send"}
          </Button>
        </form>

        <div
          className="mt-3 min-h-[1.5rem] whitespace-pre-wrap text-sm text-sky-100/90"
          aria-live="polite"
          aria-atomic="true"
        >
          {reply}
        </div>
      </div>
    </section>
  );
}

export function SmartRecommendations({ data }: { data: DashboardData }) {
  const items = useMemo(() => buildRecommendations(data), [data]);

  return (
    <Panel
      title="Smart Recommendations"
      description="Personalized — each card explains why"
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-white/8 bg-black/20 p-3"
          >
            <p className="text-sm text-white">{item.text}</p>
            <p className="mt-1 text-xs text-muted">Why: {item.why}</p>
            <Link
              href={item.href}
              className="mt-2 inline-block text-xs text-sky-300 hover:underline"
            >
              Take action →
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TeamIntelligencePanel({
  team,
}: {
  team: DashboardData["team"];
}) {
  if (!team) {
    return (
      <Panel title="Team Intelligence" description="No team yet">
        <p className="text-sm text-muted">
          Join a team to unlock member status, blockers, and collaboration metrics.
        </p>
        <Link href="/dashboard/team" className="mt-3 inline-block">
          <Button size="sm">Form a team</Button>
        </Link>
      </Panel>
    );
  }

  const members = memberPersona(team.members);
  const xp = team.members.reduce((s, m) => s + m.user.xp, 0);
  const completion = 58;

  return (
    <Panel title="Team Intelligence" description={`${team.theme ?? "Theme TBA"} · Sprint 2`}>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-sky-200">
          {team.name}
        </span>
        <span>Mentor · {team.mentorId ? "Assigned" : "Open"}</span>
        <span className="font-mono text-sky-300">XP {xp}</span>
        <span>Completion {completion}%</span>
      </div>

      <ul className="mt-4 space-y-3">
        {members.map((m) => (
          <li
            key={m.user.id}
            className="flex gap-3 rounded-2xl border border-white/8 bg-black/20 p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/40 to-violet-500/40 text-xs font-semibold text-white"
              aria-hidden
            >
              {m.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">{m.user.name}</p>
              <p className="text-xs text-muted">{m.displayRole}</p>
              <p className="mt-1 text-xs text-sky-100/90">
                Task · {m.currentTask}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                <span
                  className={
                    m.status === "Online"
                      ? "text-emerald-300"
                      : m.status === "Away"
                        ? "text-orange-300"
                        : "text-muted"
                  }
                  aria-label={`Status ${m.status}`}
                >
                  ● {m.status}
                </span>
                <span>· {m.lastActivity}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {[
          ["Tasks done", "14"],
          ["Blockers", "2"],
          ["Files shared", "7"],
          ["Mentor meets", "1"],
          ["Chat activity", "High"],
          ["Commits", "Soon"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
          >
            <p className="text-muted">{label}</p>
            <p className="mt-0.5 font-mono text-sm text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Metrics stay actionable — no individual “health scores.”
      </p>
    </Panel>
  );
}

export function ProjectHealthDashboard() {
  return (
    <Panel title="Project Health" description="Readiness at a glance">
      <ul className="space-y-3">
        {PROJECT_HEALTH.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="block group">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white group-hover:text-sky-200">
                  {item.label}
                </span>
                <span className="font-mono text-xs text-sky-300">
                  {item.value}%
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={item.label}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ActivityFeed() {
  const cats = ["All", "Team", "Mentors", "Quizzes", "Games", "Project", "Event", "Certificates"];
  const [filter, setFilter] = useState("All");
  const items = ACTIVITY_FEED.filter(
    (i) => filter === "All" || i.category === filter,
  );

  return (
    <Panel title="Activity Feed" description="Relevant events only">
      <div className="mb-3 flex flex-wrap gap-1">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] ${
              filter === c ? "bg-sky-500/20 text-sky-200" : "bg-white/5 text-muted"
            }`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="space-y-2" aria-live="polite">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-white/8 px-3 py-2 text-sm">
            <Link href={item.href} className="hover:text-sky-200">
              <span className="text-white">{item.actor}</span>{" "}
              <span className="text-muted">{item.action}</span>
            </Link>
            <p className="mt-0.5 font-mono text-[10px] text-sky-300/70">
              {item.category} · {item.at}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function XpAchievementWidget({ userXp }: { userXp?: number }) {
  const pct = Math.round((XP_TODAY.current / XP_TODAY.goal) * 100);

  return (
    <Panel title="Today's XP" description={`Lifetime · ${userXp ?? 0} career XP`}>
      <p className="font-display text-2xl text-white">
        {XP_TODAY.current}{" "}
        <span className="text-base text-muted">/ {XP_TODAY.goal} XP</span>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={XP_TODAY.current}
        aria-valuemin={0}
        aria-valuemax={XP_TODAY.goal}
        aria-label="Today XP progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {XP_TODAY.recent.map((r) => (
          <li key={r.label} className="flex justify-between text-muted">
            <span>{r.label}</span>
            <span className="font-mono text-emerald-300">+{r.xp}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/achievements"
        className="mt-3 inline-block text-xs text-sky-300 hover:underline"
      >
        All achievements →
      </Link>
    </Panel>
  );
}

export function AchievementBadgesWidget() {
  const rarityColor = {
    Common: "text-muted",
    Rare: "text-sky-300",
    Epic: "text-violet-300",
  };

  return (
    <Panel title="Achievement Badges" description="Meaningful unlocks">
      <ul className="grid gap-2 sm:grid-cols-2">
        {BADGES.slice(0, 6).map((b) => (
          <li
            key={b.id}
            className={`rounded-2xl border p-3 ${
              b.earned
                ? "border-emerald-400/25 bg-emerald-500/10"
                : "border-white/8 bg-black/20 opacity-70"
            }`}
          >
            <p className="text-sm text-white">{b.title}</p>
            <p className="mt-1 text-[11px] text-muted">{b.description}</p>
            <p className={`mt-1 font-mono text-[10px] ${rarityColor[b.rarity]}`}>
              {b.rarity}
              {b.earned && b.earnedAt ? ` · ${b.earnedAt}` : " · Locked"}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function DailyChallengeWidget() {
  const [left, setLeft] = useState(DAILY_CHALLENGE.hoursLeft);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((h) => Math.max(0, h - 0)); // display stable; clock cosmetic
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Panel title="Daily Challenge" description="Meaningful engagement XP">
      <p className="font-display text-lg text-white">{DAILY_CHALLENGE.title}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Difficulty</dt>
          <dd className="text-orange-200">{DAILY_CHALLENGE.difficulty}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Reward</dt>
          <dd className="font-mono text-emerald-300">
            {DAILY_CHALLENGE.rewardXp} XP
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Time left</dt>
          <dd className="font-mono text-sky-200">{left} Hours</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="text-muted">
            {DAILY_CHALLENGE.completed ? "Done" : "Open"}
          </dd>
        </div>
      </dl>
      <Link href={DAILY_CHALLENGE.href} className="mt-4 inline-block">
        <Button size="sm">Start</Button>
      </Link>
    </Panel>
  );
}

export function ResourceRecommendationPanel() {
  return (
    <Panel title="Resource Recommendations" description="Theme + stage aware">
      <ul className="space-y-3">
        {RESOURCE_RECS.map((r) => (
          <li key={r.title} className="rounded-2xl border border-white/8 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-white">{r.title}</p>
              <span className="font-mono text-[10px] text-sky-300">{r.type}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Why: {r.why}</p>
            <Link href={r.href} className="mt-2 inline-block text-xs text-sky-300">
              Open →
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function CollaborationPanel({
  team,
}: {
  team: DashboardData["team"];
}) {
  const online = team
    ? memberPersona(team.members).filter((m) => m.status === "Online")
    : [];

  return (
    <Panel title="Real-Time Collaboration" description="Who is building now">
      <p className="text-sm text-muted">
        Online now · {online.length || 0}
        {online.length
          ? `: ${online.map((m) => m.user.name).join(", ")}`
          : " — join a team to see presence"}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        <li>Whiteboard · Coming soon</li>
        <li>Recent upload · circuit-diagram.pdf</li>
        <li>Active discussion · firmware pin map</li>
        <li>Next meeting · Today 15:00 mentor</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/messages">
          <Button size="sm" variant="secondary">
            <MessageSquare className="h-3.5 w-3.5" /> Chat
          </Button>
        </Link>
        <Link href="/dashboard/mentor">
          <Button size="sm" variant="ghost">
            <CalendarPlus className="h-3.5 w-3.5" /> Schedule
          </Button>
        </Link>
        <Link href="/dashboard/project">
          <Button size="sm" variant="ghost">
            <FileUp className="h-3.5 w-3.5" /> Upload
          </Button>
        </Link>
        <Button size="sm" variant="ghost" disabled title="Future">
          <Video className="h-3.5 w-3.5" /> Call
        </Button>
      </div>
    </Panel>
  );
}

export function SmartNotificationsPanel() {
  const tierStyle = {
    critical: "border-rose-400/30 bg-rose-500/10",
    important: "border-orange-400/25 bg-orange-500/10",
    informational: "border-white/8 bg-black/20",
  };
  const tierLabel = {
    critical: "Critical",
    important: "Important",
    informational: "Info",
  };

  return (
    <Panel title="Smart Notifications" description="Prioritized for action">
      <ul className="space-y-2" aria-live="polite">
        {SMART_NOTIFS.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border p-3 ${tierStyle[n.tier]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <Link href={n.href} className="text-sm text-white hover:underline">
                {n.title}
              </Link>
              <span className="font-mono text-[10px] uppercase text-muted">
                {tierLabel[n.tier]}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{n.body}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/settings"
        className="mt-3 inline-block text-xs text-sky-300 hover:underline"
      >
        Notification preferences →
      </Link>
    </Panel>
  );
}
