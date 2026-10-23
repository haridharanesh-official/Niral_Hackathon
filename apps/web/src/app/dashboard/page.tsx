"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  trackDashboardEvent,
  useDashboardData,
  useTodaysTasks,
  useWidgetLayout,
  WidgetId,
} from "@/components/dashboard/command-center/hooks";
import {
  AnnouncementsWidget,
  CalendarWidget,
  EventTimeline,
  LeaderboardPreview,
  ProgressOverview,
  QuizGamesProgress,
  TodaysTasks,
  WelcomeBanner,
  WidgetCustomizeBar,
} from "@/components/dashboard/command-center/widgets";
import {
  AchievementBadgesWidget,
  ActivityFeed,
  AiSmartWorkspace,
  CollaborationPanel,
  DailyChallengeWidget,
  ProjectHealthDashboard,
  ResourceRecommendationPanel,
  SmartNotificationsPanel,
  SmartRecommendations,
  TeamIntelligencePanel,
  XpAchievementWidget,
} from "@/components/dashboard/command-center/intelligence-widgets";
import { cn } from "@/lib/utils";

const WIDE: WidgetId[] = ["aiWorkspace", "teamIntel", "projectHealth", "activity"];

export default function DashboardPage() {
  const { data, loading, offline, saveWidgetConfig, session, EVENT_START, PHASES } =
    useDashboardData();
  const { tasks, toggle, defer } = useTodaysTasks(
    data.checklist,
    session?.accessToken,
  );
  const layout = useWidgetLayout(data.widgetConfig ?? null, saveWidgetConfig);

  useEffect(() => {
    trackDashboardEvent("dashboard_opened", { role: session?.user?.role });
  }, [session?.user?.role]);

  const widgets: Record<WidgetId, ReactNode> = {
    aiWorkspace: (
      <AiSmartWorkspace data={data} name={session?.user?.name} />
    ),
    recommendations: <SmartRecommendations data={data} />,
    progress: (
      <ProgressOverview checklist={data.checklist} percent={data.percent} />
    ),
    tasks: <TodaysTasks tasks={tasks} onToggle={toggle} onDefer={defer} />,
    projectHealth: <ProjectHealthDashboard />,
    teamIntel: <TeamIntelligencePanel team={data.team} />,
    timeline: <EventTimeline phases={PHASES} />,
    activity: <ActivityFeed />,
    xp: <XpAchievementWidget userXp={session?.user?.xp} />,
    badges: <AchievementBadgesWidget />,
    dailyChallenge: <DailyChallengeWidget />,
    resources: <ResourceRecommendationPanel />,
    collab: <CollaborationPanel team={data.team} />,
    announcements: <AnnouncementsWidget />,
    smartNotifs: <SmartNotificationsPanel />,
    leaderboard: <LeaderboardPreview />,
    calendar: <CalendarWidget />,
    quizGames: <QuizGamesProgress />,
  };

  return (
    <div
      className={cn(
        "motion-safe:animate-in space-y-6",
        layout.density === "compact" && "space-y-4 [&_section]:p-4",
      )}
    >
      <a
        href="#main-widgets"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-sky-500 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to dashboard widgets
      </a>

      <WelcomeBanner
        name={session?.user?.name}
        teamName={data.team?.name}
        eventName={data.eventName}
        eventStart={EVENT_START}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {loading
            ? "Syncing Innovation OS…"
            : "Proactive workspace · prioritized by timeline, team, and progress"}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono">
            /
          </kbd>
          <span>focus search</span>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono">
            g then t
          </kbd>
          <span>team</span>
        </div>
        <WidgetCustomizeBar
          hidden={layout.hidden}
          visible={layout.visible}
          onToggle={layout.toggleWidget}
          onMove={layout.moveWidget}
          onRestore={layout.restoreDefaults}
          density={layout.density}
          onDensity={layout.setDensityPref}
        />
      </div>

      {offline ? (
        <div
          className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100"
          role="status"
          aria-live="polite"
        >
          Offline mode: showing last synchronized dashboard. Live updates resume
          automatically when connection returns.
        </div>
      ) : null}

      <div id="main-widgets" className="grid gap-4 xl:grid-cols-3">
        {layout.visible.map((id) => (
          <div
            key={id}
            className={cn(WIDE.includes(id) && "xl:col-span-2")}
          >
            {widgets[id]}
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2">
        <a
          href="/ai"
          className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-xs text-violet-100 backdrop-blur hover:bg-violet-500/30"
        >
          AI Assist
        </a>
        <a
          href="/dashboard/team"
          className="rounded-full border border-sky-400/30 bg-sky-500/20 px-3 py-2 text-xs text-sky-100 backdrop-blur hover:bg-sky-500/30"
        >
          Team Chat
        </a>
      </div>
    </div>
  );
}
