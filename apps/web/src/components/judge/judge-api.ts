import type {
  JudgeAssignmentItem,
  JudgeDashboard,
  JudgeScores,
  JudgeWorkspace,
} from "./judge-types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function get<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${apiUrl}/api/judge${path}`, {
    headers: headers(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function mutate<T>(
  token: string,
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${apiUrl}/api/judge${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function fetchJudgeDashboard(token: string) {
  return get<JudgeDashboard>(token, "/dashboard");
}

export function fetchJudgeAssignments(
  token: string,
  query?: { status?: string; sort?: string },
) {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.sort) params.set("sort", query.sort);
  const qs = params.toString();
  return get<JudgeAssignmentItem[]>(token, `/assignments${qs ? `?${qs}` : ""}`);
}

export function fetchJudgeWorkspace(token: string, assignmentId: string) {
  return get<JudgeWorkspace>(token, `/assignments/${assignmentId}`);
}

export function saveEvaluation(
  token: string,
  assignmentId: string,
  body: Partial<JudgeScores> & { comments?: string },
) {
  return mutate(token, `/assignments/${assignmentId}/evaluation`, "PATCH", body);
}

export function submitEvaluation(token: string, assignmentId: string) {
  return mutate(token, `/assignments/${assignmentId}/evaluation/submit`, "POST", {
    confirm: true,
  });
}

export function updateJudgeNote(
  token: string,
  assignmentId: string,
  content: string,
) {
  return mutate(token, `/assignments/${assignmentId}/notes`, "PATCH", { content });
}

export function toggleJudgeBookmark(
  token: string,
  assignmentId: string,
  label: string,
) {
  return mutate(token, `/assignments/${assignmentId}/bookmarks`, "POST", { label });
}

export function fetchJudgeRubric(token: string) {
  return get(token, "/rubric");
}

export function fetchJudgeAnalytics(token: string) {
  return get(token, "/analytics");
}

const DRAFT_PREFIX = "hackos.judge.draft.";

export function saveEvaluationDraft(assignmentId: string, data: unknown) {
  try {
    localStorage.setItem(
      `${DRAFT_PREFIX}${assignmentId}`,
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function loadEvaluationDraft(assignmentId: string): unknown | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${assignmentId}`);
    if (!raw) return null;
    return (JSON.parse(raw) as { data: unknown }).data;
  } catch {
    return null;
  }
}

export function clearEvaluationDraft(assignmentId: string) {
  localStorage.removeItem(`${DRAFT_PREFIX}${assignmentId}`);
}
