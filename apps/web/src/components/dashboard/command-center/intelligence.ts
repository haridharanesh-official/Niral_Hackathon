import type { DashboardData } from "@/components/dashboard/command-center/hooks";
import { currentPhase, greeting } from "@/components/dashboard/command-center/hooks";

export type Recommendation = {
  id: string;
  text: string;
  why: string;
  href: string;
  priority: number;
};

export function buildRecommendations(data: DashboardData): Recommendation[] {
  const items: Recommendation[] = [];
  const phase = currentPhase();

  if (!data.checklist?.profile) {
    items.push({
      id: "profile",
      text: "Complete your profile to unlock better team matching.",
      why: "Based on incomplete onboarding profile",
      href: "/dashboard/onboarding",
      priority: 10,
    });
  }
  if (!data.checklist?.event) {
    items.push({
      id: "enroll",
      text: "Confirm event enrollment to receive your registration ID.",
      why: "Event timeline requires confirmed registration",
      href: "/dashboard/enrollment",
      priority: 20,
    });
  }
  if (!data.team) {
    items.push({
      id: "team",
      text: "Create or join a team before the formation deadline.",
      why: "No active team membership detected",
      href: "/dashboard/team",
      priority: 30,
    });
  } else if (!data.team.mentorId) {
    items.push({
      id: "mentor",
      text: "Your team hasn't booked a mentor session yet.",
      why: "Team activity · mentor not assigned",
      href: "/dashboard/mentor",
      priority: 40,
    });
  }

  items.push({
    id: "mqtt",
    text: "Teams working on Industrial IoT often review the MQTT workshop before the checkpoint.",
    why: data.team?.theme
      ? `Theme “${data.team.theme}” · phase ${phase.label}`
      : `Event schedule · phase ${phase.label}`,
    href: "/dashboard/resources",
    priority: 50,
  });

  items.push({
    id: "badge",
    text: "You are one task away from earning the Rapid Builder badge.",
    why: "Previous behavior · task completion streak",
    href: "/dashboard/achievements",
    priority: 60,
  });

  items.push({
    id: "quiz",
    text: "Finish today's IoT Quiz to keep your learning streak.",
    why: "Quiz performance · daily challenge window open",
    href: "/quiz",
    priority: 55,
  });

  return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

export function buildAiSuggestions(data: DashboardData, name?: string | null) {
  const recs = buildRecommendations(data);
  return {
    greeting: greeting(name),
    bullets: recs.slice(0, 4).map((r) => r.text.replace(/\.$/, "")),
    context: data.eventName,
    phase: currentPhase().label,
  };
}

export const PROJECT_HEALTH = [
  { key: "proposal", label: "Proposal submitted", value: 100, href: "/dashboard/project" },
  { key: "architecture", label: "Architecture", value: 90, href: "/dashboard/project" },
  { key: "hardware", label: "Hardware acquired", value: 80, href: "/dashboard/hardware" },
  { key: "firmware", label: "Firmware progress", value: 70, href: "/dashboard/project" },
  { key: "software", label: "Software / AI model", value: 60, href: "/dashboard/project" },
  { key: "testing", label: "Testing status", value: 45, href: "/dashboard/project" },
  { key: "docs", label: "Documentation", value: 40, href: "/dashboard/project" },
  { key: "presentation", label: "Presentation readiness", value: 20, href: "/dashboard/project" },
] as const;

export const ACTIVITY_FEED = [
  {
    id: "1",
    category: "Team",
    actor: "Arun",
    action: "joined the team",
    at: "12 min ago",
    href: "/dashboard/team",
  },
  {
    id: "2",
    category: "Mentors",
    actor: "System",
    action: "Mentor meeting scheduled for 15:00",
    at: "1 hr ago",
    href: "/dashboard/mentor",
  },
  {
    id: "3",
    category: "Quizzes",
    actor: "HackOS",
    action: "Daily challenge published",
    at: "2 hr ago",
    href: "/quiz",
  },
  {
    id: "4",
    category: "Event",
    actor: "Organizer",
    action: "Pinned announcement: Hardware desk open",
    at: "3 hr ago",
    href: "/dashboard#notifications",
  },
  {
    id: "5",
    category: "Project",
    actor: "Divya",
    action: "uploaded circuit-diagram.pdf",
    at: "4 hr ago",
    href: "/dashboard/project",
  },
  {
    id: "6",
    category: "Games",
    actor: "You",
    action: "earned +50 XP from Sensor Hunt",
    at: "Yesterday",
    href: "/games",
  },
  {
    id: "7",
    category: "Certificates",
    actor: "System",
    action: "Badge unlocked: Team Builder",
    at: "Yesterday",
    href: "/dashboard/achievements",
  },
] as const;

export const XP_TODAY = {
  current: 220,
  goal: 300,
  recent: [
    { label: "Daily Login", xp: 20 },
    { label: "Quiz Completed", xp: 50 },
    { label: "Mentor Session", xp: 100 },
    { label: "Documentation Upload", xp: 50 },
  ],
};

export const BADGES = [
  {
    id: "first-login",
    title: "First Login",
    description: "Signed into HackOS",
    criteria: "Complete first successful login",
    earned: true,
    earnedAt: "2026-07-10",
    rarity: "Common" as const,
  },
  {
    id: "team-builder",
    title: "Team Builder",
    description: "Created or joined a squad",
    criteria: "Join or create a team",
    earned: true,
    earnedAt: "2026-07-12",
    rarity: "Common" as const,
  },
  {
    id: "fast-learner",
    title: "Fast Learner",
    description: "Completed 3 learning resources",
    criteria: "Finish 3 Learning Hub items",
    earned: false,
    earnedAt: null,
    rarity: "Rare" as const,
  },
  {
    id: "quiz-champion",
    title: "Quiz Champion",
    description: "Score 90%+ on a quiz",
    criteria: "Quiz score ≥ 90%",
    earned: false,
    earnedAt: null,
    rarity: "Rare" as const,
  },
  {
    id: "hardware-explorer",
    title: "Hardware Explorer",
    description: "Booked a hardware kit",
    criteria: "Complete a hardware booking",
    earned: false,
    earnedAt: null,
    rarity: "Rare" as const,
  },
  {
    id: "ai-innovator",
    title: "AI Innovator",
    description: "Ship an AI-assisted feature",
    criteria: "Submit project with AI track",
    earned: false,
    earnedAt: null,
    rarity: "Epic" as const,
  },
  {
    id: "mentors-choice",
    title: "Mentor's Choice",
    description: "Highlighted by a mentor",
    criteria: "Receive mentor nomination",
    earned: false,
    earnedAt: null,
    rarity: "Epic" as const,
  },
  {
    id: "docs-expert",
    title: "Documentation Expert",
    description: "Docs completeness ≥ 80%",
    criteria: "Documentation indicator ≥ 80%",
    earned: false,
    earnedAt: null,
    rarity: "Rare" as const,
  },
];

export const DAILY_CHALLENGE = {
  title: "Build an MQTT Sensor Publisher",
  difficulty: "Intermediate",
  rewardXp: 150,
  hoursLeft: 12,
  completed: false,
  href: "/games/daily",
};

export const RESOURCE_RECS = [
  {
    title: "Official MQTT primer",
    type: "Documentation",
    why: "Matches Industrial IoT theme + prototype phase",
    href: "/dashboard/resources",
  },
  {
    title: "Edge Intelligence workshop recording",
    type: "Video",
    why: "Recommended for current sprint",
    href: "/dashboard/resources",
  },
  {
    title: "ESP32 sample firmware repo",
    type: "Repository",
    why: "Team has embedded focus",
    href: "/dashboard/resources",
  },
  {
    title: "Judging criteria explainer",
    type: "Guide",
    why: "Presentation readiness is low",
    href: "/dashboard/resources",
  },
];

export const SMART_NOTIFS = [
  {
    id: "c1",
    tier: "critical" as const,
    title: "Mentor meeting in 10 minutes",
    body: "Embedded Architecture · Room C2",
    href: "/dashboard/mentor",
  },
  {
    id: "c2",
    tier: "critical" as const,
    title: "Prototype checkpoint tomorrow 12:00",
    body: "Submission deadline approaching",
    href: "/dashboard/project",
  },
  {
    id: "i1",
    tier: "important" as const,
    title: "New announcement pinned",
    body: "Hardware desk opens at 10:00",
    href: "/dashboard",
  },
  {
    id: "i2",
    tier: "important" as const,
    title: "Daily quiz released",
    body: "IoT fundamentals · 15 minutes",
    href: "/quiz",
  },
  {
    id: "n1",
    tier: "informational" as const,
    title: "Badge earned: Team Builder",
    body: "Nice work forming your squad",
    href: "/dashboard/achievements",
  },
  {
    id: "n2",
    tier: "informational" as const,
    title: "Daily streak · 4 days",
    body: "Keep logging in for bonus XP",
    href: "/dashboard",
  },
];

export function memberPersona(
  members: NonNullable<DashboardData["team"]>["members"],
) {
  const roles = ["AI Engineer", "Embedded Developer", "Cloud / Backend", "Product / Docs"];
  const tasks = [
    "Vision model training",
    "ESP32 firmware",
    "API gateway",
    "Architecture notes",
  ];
  const statuses = ["Online", "Online", "Away", "Offline"] as const;

  return members.map((m, i) => ({
    ...m,
    displayRole: m.role === "LEADER" ? "Team Lead · " + roles[i % roles.length] : roles[i % roles.length],
    status: statuses[i % statuses.length],
    currentTask: tasks[i % tasks.length],
    lastActivity: i === 0 ? "Just now" : `${(i + 1) * 12} min ago`,
  }));
}
