"use client";

import { useCallback, useEffect, useState, useRef } from "react";
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

const EVENT_START = 0;
const PHASES: {id:string;label:string;ends:number}[] = [];
export function currentPhase() { return {id:'unconfirmed', label:'Schedule to be announced', ends:0}; }

export function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const first = name?.split(" ")[0] ?? "Hacker";
  if (hour < 12) return `Good Morning, ${first}`;
  if (hour < 17) return `Good Afternoon, ${first}`;
  return `Good Evening, ${first}`;
}

const EMPTY_DASHBOARD: DashboardData = {checklist:null,percent:0,team:null,enrollment:null,eventName:'Event details to be announced',notifications:[]};
export function useDashboardData() {
 const {data:session}=useSession();
 const owner=session?.user?.id, token=session?.accessToken;
 const latest=useRef({owner,token}); latest.current={owner,token};
 const [snapshot,setSnapshot]=useState<{owner:string;data:DashboardData}|null>(null);
 const [loading,setLoading]=useState(true),[offline,setOffline]=useState(false);
 const refresh=useCallback(async()=>{
  if(!owner||!token)return;
  setLoading(true);
  try {
   const [r,o]=await Promise.all([fetch(apiUrl+'/api/dashboard/summary',{headers:{Authorization:'Bearer '+token},cache:'no-store'}),fetch(apiUrl+'/api/auth/onboarding',{headers:{Authorization:'Bearer '+token},cache:'no-store'})]);
   if(!r.ok||!o.ok)throw Error('Dashboard unavailable');
   const summary=await r.json(),onboarding=await o.json();
   if(latest.current.owner!==owner||latest.current.token!==token||summary.userSummary?.id!==owner)return;
   setSnapshot({owner,data:{checklist:onboarding.checklist??null,percent:onboarding.percent??0,team:summary.teamOverview??null,enrollment:summary.enrollment??null,eventName:summary.event?.name??EMPTY_DASHBOARD.eventName,notifications:summary.notifications??[],widgetConfig:summary.widgetConfig??null}});
   setOffline(false);
  } catch {if(latest.current.owner===owner){setSnapshot(null);setOffline(true);}}
  finally {if(latest.current.owner===owner)setLoading(false);}
 },[owner,token]);
 useEffect(()=>{for(const key of ['hackos.dashboard.summary.cache','hackos.dashboard.tasks','hackos.dashboard.tasks.queue','hackos.dashboard.widgets']){try{localStorage.removeItem(key);}catch{}} const timer=setTimeout(()=>{void refresh();},0);return()=>clearTimeout(timer);},[refresh]);
 const saveWidgetConfig=useCallback(async(config:NonNullable<DashboardData['widgetConfig']>)=>{if(!token)return;const r=await fetch(apiUrl+'/api/dashboard/widgets',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(config),cache:'no-store'});if(!r.ok)throw Error('Could not save preferences');},[token]);
 return {data:owner&&snapshot?.owner===owner?snapshot.data:EMPTY_DASHBOARD,loading,offline,refresh,saveWidgetConfig,session,EVENT_START,PHASES,ONBOARDING_CHECKLIST};
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

export function useTodaysTasks(_checklist: Record<string,boolean>|null,accessToken?:string) {
 const [snapshot,setSnapshot]=useState<{token:string;items:TaskItem[]}|null>(null);
 const tokenRef=useRef(accessToken);tokenRef.current=accessToken;
 useEffect(()=>{const abort=new AbortController();if(accessToken)void fetch(apiUrl+'/api/dashboard/tasks',{headers:{Authorization:'Bearer '+accessToken},cache:'no-store',signal:abort.signal}).then(async r=>{if(!r.ok)throw Error('Unavailable');const items=await r.json();if(!abort.signal.aborted&&tokenRef.current===accessToken)setSnapshot({token:accessToken,items:Array.isArray(items)?items:[]});}).catch(()=>{if(!abort.signal.aborted)setSnapshot(null);});return()=>abort.abort();},[accessToken]);
 const tasks=accessToken&&snapshot?.token===accessToken?snapshot.items:[];
 async function save(id:string,defer:boolean){const current=tasks.find(t=>t.id===id);if(!current||!accessToken||!navigator.onLine)return;const next=defer?{...current,due:'Deferred',priority:'low' as const}:{...current,done:!current.done};const r=await fetch(apiUrl+'/api/dashboard/tasks',{method:'PATCH',cache:'no-store',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify(next)});if(r.ok&&tokenRef.current===accessToken){const items=await r.json();setSnapshot({token:accessToken,items});}}
 return {tasks,toggle:(id:string)=>{void save(id,false).catch(()=>undefined);},defer:(id:string)=>{void save(id,true).catch(()=>undefined);}};
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
    persist({ hidden: [], order: [...WIDGET_IDS], density: 'comfortable' });
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
