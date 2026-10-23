import { ROLE_DASHBOARD_PATH, UserRole } from "@hackos/shared";

export function dashboardPathForRole(role?: string | null): string {
  if (!role) return "/dashboard";
  const key = role as UserRole;
  return ROLE_DASHBOARD_PATH[key] ?? "/dashboard";
}

export const ROLE_LABELS: Record<string, string> = {
  PARTICIPANT: "Participant Dashboard",
  TEAM_LEADER: "Team Workspace",
  MENTOR: "Mentor Portal",
  JUDGE: "Judge Dashboard",
  VOLUNTEER: "Volunteer Dashboard",
  ORGANIZER: "Organizer Console",
  SPONSOR: "Sponsor Portal",
  ADMIN: "Admin Dashboard",
  VISITOR: "Home",
};

const FAIL_KEY = "hackos.login.failures";

export function getLoginFailureState(): { count: number; lockedUntil: number } {
  if (typeof window === "undefined") return { count: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(FAIL_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw) as { count: number; lockedUntil: number };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

export function recordLoginFailure(): { count: number; lockedUntil: number; delayMs: number } {
  const prev = getLoginFailureState();
  const count = prev.count + 1;
  const delayMs = Math.min(8000, 400 * Math.pow(2, Math.max(0, count - 1)));
  const lockedUntil = count >= 8 ? Date.now() + 5 * 60_000 : 0;
  const next = { count, lockedUntil };
  localStorage.setItem(FAIL_KEY, JSON.stringify(next));
  return { ...next, delayMs };
}

export function clearLoginFailures() {
  localStorage.removeItem(FAIL_KEY);
}

export const REMEMBER_KEY = "hackos.login.remember";
export const LANG_KEY = "hackos.pref.lang";
export const THEME_KEY = "hackos.pref.theme";
