"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ONBOARDING_CHECKLIST } from "@hackos/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type DashboardData = {
  checklist: Record<string, boolean> | null;
  percent: number;
  team: {
    id: string;
    name: string;
    status: string;
    theme?: string | null;
    mentorId?: string | null;
    members: Array<{
      role: string;
      user: { id: string; name: string; xp: number };
    }>;
    leader?: { name: string } | null;
  } | null;
  enrollment: {
    registrationId: string;
    mode: string;
  } | null;
  eventName: string;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    type: string;
    link?: string | null;
    createdAt?: string;
  }>;
  widgetConfig?: {
    hidden?: WidgetId[];
    order?: WidgetId[];
    density?: "comfortable" | "compact";
  } | null;
};

const EVENT_START = new Date("2026-08-15T09:00:00Z").getTime();
const PHASES = [
  { id: "reg", label: "Registration", ends: new Date("2026-07-31T18:00:00Z").getTime() },
  { id: "ideate", label: "Ideation", ends: new Date("2026-08-15T18:00:00Z").getTime() },
  { id: "proto", label: "Prototype Development", ends: new Date("2026-08-16T18:00:00Z").getTime() },
  { id: "submit", label: "Final Submission", ends: new Date("2026-08-17T12:00:00Z").getTime() },
  { id: "demo", label: "Demo Day", ends: new Date("2026-08-17T18:00:00Z").getTime() },
];

export function currentPhase() {
  const now = Date.now();
  for (const phase of PHASES) {
    if (now < phase.ends) return phase;
  }
  return PHASES[PHASES.length - 1];
}

export function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const first = name?.split(" ")[0] ?? "Hacker";
  if (hour < 12) return `Good Morning, ${first}`;
  if (hour < 17) return `Good Afternoon, ${first}`;
  return `Good Evening, ${first}`;
}

export function useDashboardData() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData>({
    checklist: null,
    percent: 0,
    team: null,
    enrollment: null,
    eventName: "HackOS IoT Innovation Hackathon",
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const CACHE_KEY = "hackos.dashboard.summary.cache";

  const refresh = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    const token = session.accessToken;
    try {
      const [summary, onboarding] = await Promise.all([
        fetch(`${apiUrl}/api/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/auth/onboarding`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      setData({
        checklist: onboarding?.checklist ?? null,
        percent: onboarding?.percent ?? 0,
        team: summary?.teamOverview?.id ? summary.teamOverview : null,
        enrollment: summary?.enrollment ?? null,
        eventName:
          summary?.event?.name ?? "HackOS IoT Innovation Hackathon",
        notifications: Array.isArray(summary?.notifications)
          ? summary.notifications.slice(0, 8)
          : [],
        widgetConfig: summary?.widgetConfig ?? null,
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(summary));
      setOffline(false);
    } catch {
      setOffline(!navigator.onLine);
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;
        const summary = JSON.parse(cached) as {
          teamOverview?: DashboardData["team"];
          enrollment?: DashboardData["enrollment"];
          event?: { name?: string };
          notifications?: DashboardData["notifications"];
          widgetConfig?: DashboardData["widgetConfig"];
        };
        setData((prev) => ({
          ...prev,
          team: summary.teamOverview ?? prev.team,
          enrollment: summary.enrollment ?? prev.enrollment,
          eventName: summary.event?.name ?? prev.eventName,
          notifications: summary.notifications ?? prev.notifications,
          widgetConfig: summary.widgetConfig ?? prev.widgetConfig,
        }));
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!session?.accessToken) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh().catch(() => undefined);
      }
    };
    const onOffline = () => setOffline(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refresh().catch(() => undefined);
    }, 30_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onVisibility);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onVisibility);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, session?.accessToken]);

  const saveWidgetConfig = useCallback(
    async (config: {
      hidden?: WidgetId[];
      order?: WidgetId[];
      density?: "comfortable" | "compact";
    }) => {
      if (!session?.accessToken) return;
      await fetch(`${apiUrl}/api/dashboard/widgets`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      }).catch(() => undefined);
    },
    [session?.accessToken],
  );

  return {
    data,
    loading,
    offline,
    refresh,
    saveWidgetConfig,
    session,
    EVENT_START,
    PHASES,
    ONBOARDING_CHECKLIST,
  };
}

export type WidgetLifecycleState =
  | "initial"
  | "loading"
  | "ready"
  | "refreshing"
  | "empty"
  | "error";

export function useWidgetLifecycle<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<WidgetLifecycleState>("initial");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (mode: "loading" | "refreshing" = "loading") => {
      setState(mode);
      setError(null);
      try {
        const next = await loader();
        if (!next || (Array.isArray(next) && next.length === 0)) {
          setState("empty");
          setData(next);
          return;
        }
        setData(next);
        setState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setState("error");
      }
    },
    [loader],
  );

  useEffect(() => {
    run("loading").catch(() => setState("error"));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, data, error, refresh: () => run("refreshing") };
}

export type TaskItem = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  due: string;
  effort: string;
  href: string;
  done: boolean;
};

const TASKS_KEY = "hackos.dashboard.tasks";

export function useTodaysTasks(
  checklist: Record<string, boolean> | null,
  accessToken?: string,
) {
  const defaults: TaskItem[] = [
    {
      id: "proposal",
      title: "Complete project proposal",
      priority: "high",
      due: "Today · 18:00",
      effort: "45 min",
      href: "/dashboard/project",
      done: false,
    },
    {
      id: "circuit",
      title: "Upload circuit diagram",
      priority: "medium",
      due: "Today · 20:00",
      effort: "30 min",
      href: "/dashboard/project",
      done: false,
    },
    {
      id: "mentor",
      title: "Attend mentor meeting",
      priority: "high",
      due: "Today · 15:00",
      effort: "30 min",
      href: "/dashboard/mentor",
      done: false,
    },
    {
      id: "quiz",
      title: "Finish Daily Quiz",
      priority: "medium",
      due: "Today · 23:59",
      effort: "15 min",
      href: "/quiz",
      done: false,
    },
    {
      id: "iot",
      title: "Complete IoT Challenge",
      priority: "low",
      due: "Tomorrow",
      effort: "1 hr",
      href: "/games",
      done: false,
    },
    {
      id: "rubric",
      title: "Review judging rubric",
      priority: "low",
      due: "This week",
      effort: "20 min",
      href: "/dashboard/resources",
      done: false,
    },
  ];

  const [tasks, setTasks] = useState<TaskItem[]>(defaults);
  const QUEUE_KEY = "hackos.dashboard.tasks.queue";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) setTasks(JSON.parse(raw) as TaskItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${apiUrl}/api/dashboard/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) return;
        setTasks(items as TaskItem[]);
      })
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const flush = async () => {
      if (!navigator.onLine) return;
      const queued = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as TaskItem[];
      if (!queued.length) return;
      for (const task of queued) {
        await fetch(`${apiUrl}/api/dashboard/tasks`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        }).catch(() => undefined);
      }
      localStorage.removeItem(QUEUE_KEY);
    };
    flush().catch(() => undefined);
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [accessToken]);

  useEffect(() => {
    if (!checklist) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === "proposal" && checklist.profile && checklist.team) {
          return t;
        }
        return t;
      }),
    );
  }, [checklist]);

  function toggle(id: string) {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      localStorage.setItem(TASKS_KEY, JSON.stringify(next));
      const changed = next.find((t) => t.id === id);
      if (changed) {
        if (accessToken && navigator.onLine) {
          fetch(`${apiUrl}/api/dashboard/tasks`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(changed),
          }).catch(() => undefined);
        } else {
          const queued = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as TaskItem[];
          localStorage.setItem(
            QUEUE_KEY,
            JSON.stringify([changed, ...queued.filter((q) => q.id !== changed.id)]),
          );
        }
      }
      return next;
    });
  }

  function defer(id: string) {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, due: "Deferred", priority: "low" as const } : t,
      );
      localStorage.setItem(TASKS_KEY, JSON.stringify(next));
      const changed = next.find((t) => t.id === id);
      if (changed) {
        if (accessToken && navigator.onLine) {
          fetch(`${apiUrl}/api/dashboard/tasks`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(changed),
          }).catch(() => undefined);
        } else {
          const queued = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as TaskItem[];
          localStorage.setItem(
            QUEUE_KEY,
            JSON.stringify([changed, ...queued.filter((q) => q.id !== changed.id)]),
          );
        }
      }
      return next;
    });
  }

  return { tasks, toggle, defer };
}

export const WIDGET_IDS = [
  "aiWorkspace",
  "recommendations",
  "progress",
  "tasks",
  "projectHealth",
  "teamIntel",
  "timeline",
  "activity",
  "xp",
  "badges",
  "dailyChallenge",
  "resources",
  "collab",
  "announcements",
  "smartNotifs",
  "leaderboard",
  "calendar",
  "quizGames",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export const WIDGET_LABELS: Record<WidgetId, string> = {
  aiWorkspace: "AI Smart Workspace",
  recommendations: "Smart Recommendations",
  progress: "Progress Overview",
  tasks: "Today's Tasks",
  projectHealth: "Project Health",
  teamIntel: "Team Intelligence",
  timeline: "Event Timeline",
  activity: "Activity Feed",
  xp: "XP & Streak",
  badges: "Achievement Badges",
  dailyChallenge: "Daily Challenge",
  resources: "Resource Recommendations",
  collab: "Live Collaboration",
  announcements: "Announcements",
  smartNotifs: "Smart Notifications",
  leaderboard: "Leaderboard",
  calendar: "Calendar",
  quizGames: "Quiz & Games",
};

const LAYOUT_KEY = "hackos.dashboard.widgets";

export function useWidgetLayout(
  initial?: {
    hidden?: WidgetId[];
    order?: WidgetId[];
    density?: "comfortable" | "compact";
  } | null,
  onPersist?: (config: {
    hidden?: WidgetId[];
    order?: WidgetId[];
    density?: "comfortable" | "compact";
  }) => void,
) {
  const [hidden, setHidden] = useState<WidgetId[]>([]);
  const [order, setOrder] = useState<WidgetId[]>([...WIDGET_IDS]);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        hidden?: WidgetId[];
        order?: WidgetId[];
        density?: "comfortable" | "compact";
      };
      if (parsed.hidden) setHidden(parsed.hidden.filter((id) => WIDGET_IDS.includes(id)));
      if (parsed.order?.length) {
        const known = parsed.order.filter((id) => WIDGET_IDS.includes(id));
        const missing = WIDGET_IDS.filter((id) => !known.includes(id));
        setOrder([...known, ...missing]);
      }
      if (parsed.density) setDensity(parsed.density);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!initial) return;
    if (initial.hidden?.length) {
      setHidden(initial.hidden.filter((id) => WIDGET_IDS.includes(id)));
    }
    if (initial.order?.length) {
      const known = initial.order.filter((id) => WIDGET_IDS.includes(id));
      const missing = WIDGET_IDS.filter((id) => !known.includes(id));
      setOrder([...known, ...missing]);
    }
    if (initial.density) setDensity(initial.density);
  }, [initial]);

  function persist(next: {
    hidden?: WidgetId[];
    order?: WidgetId[];
    density?: "comfortable" | "compact";
  }) {
    const payload = {
      hidden: next.hidden ?? hidden,
      order: next.order ?? order,
      density: next.density ?? density,
    };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(payload));
    onPersist?.(payload);
  }

  function toggleWidget(id: WidgetId) {
    setHidden((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      persist({ hidden: next });
      return next;
    });
  }

  function moveWidget(id: WidgetId, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      persist({ order: next });
      return next;
    });
  }

  function restoreDefaults() {
    setHidden([]);
    setOrder([...WIDGET_IDS]);
    setDensity("comfortable");
    localStorage.removeItem(LAYOUT_KEY);
  }

  function setDensityPref(value: "comfortable" | "compact") {
    setDensity(value);
    persist({ density: value });
  }

  const visible = order.filter((id) => !hidden.includes(id));

  return {
    hidden,
    order,
    density,
    visible,
    toggleWidget,
    moveWidget,
    restoreDefaults,
    setDensityPref,
  };
}

export const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Hardware desk opens at 10:00",
    summary: "Collect sensor kits from Desk B with your registration ID.",
    at: "Today · 08:30",
    priority: "high" as const,
  },
  {
    id: "2",
    title: "Mentor Marathon slots released",
    summary: "Book 20-minute reviews from the Mentor Sessions page.",
    at: "Yesterday",
    priority: "medium" as const,
  },
  {
    id: "3",
    title: "Judging rubric published",
    summary: "Innovation, technical depth, and demo clarity weighted equally.",
    at: "2 days ago",
    priority: "low" as const,
  },
];

const TELEMETRY_KEY = "hackos.analytics.events";
const CONSENT_KEY = "hackos.analytics.consent";

export function trackDashboardEvent(
  name: string,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === "denied") return;
  const event = {
    name,
    at: new Date().toISOString(),
    payload: payload ?? {},
  };
  try {
    const prev = JSON.parse(localStorage.getItem(TELEMETRY_KEY) ?? "[]") as unknown[];
    localStorage.setItem(
      TELEMETRY_KEY,
      JSON.stringify([event, ...prev].slice(0, 200)),
    );
  } catch {
    /* ignore telemetry failures */
  }
}
