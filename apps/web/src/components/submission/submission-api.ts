import type { SubmissionData, SubmissionWorkspace, ValidationReport } from "./submission-types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function get<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${apiUrl}/api/submission${path}`, {
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
  const res = await fetch(`${apiUrl}/api/submission${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | object };
      throw new Error(
        typeof parsed.message === "string"
          ? parsed.message
          : text,
      );
    } catch {
      throw new Error(text);
    }
  }
  return res.json() as Promise<T>;
}

export function fetchSubmissionWorkspace(token: string) {
  return get<SubmissionWorkspace>(token, "");
}

export function fetchSubmissionPreview(token: string) {
  return get<SubmissionWorkspace & { judgeView: boolean }>(token, "/preview");
}

export function updateSubmissionDetails(
  token: string,
  body: Record<string, unknown>,
) {
  return mutate<SubmissionData>(token, "/details", "PATCH", body);
}

export function addDeliverable(token: string, body: Record<string, unknown>) {
  return mutate(token, "/deliverables", "POST", body);
}

export function updateDeliverable(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return mutate(token, `/deliverables/${id}`, "PATCH", body);
}

export function removeDeliverable(token: string, id: string) {
  return mutate(token, `/deliverables/${id}`, "DELETE");
}

export function acceptCompliance(
  token: string,
  declaration: string,
  accepted: boolean,
) {
  return mutate(token, "/compliance", "POST", { declaration, accepted });
}

export function runValidation(token: string) {
  return mutate<ValidationReport>(token, "/validate", "POST");
}

export function createVersion(token: string, changeSummary?: string) {
  return mutate(token, "/versions", "POST", { changeSummary });
}

export function restoreVersion(token: string, version: number) {
  return mutate(token, `/versions/${version}/restore`, "POST");
}

export function submitProject(
  token: string,
  changeSummary?: string,
) {
  return mutate(token, "/submit", "POST", {
    confirm: true,
    changeSummary,
  });
}

export function fetchReceipt(token: string) {
  return get<{
    receiptId: string;
    submissionId: string;
    timestamp: string | null;
    version: number;
    eventName: string;
    projectName: string;
    teamName: string;
    status: string;
    message: string;
  }>(token, "/receipt");
}

const DRAFT_KEY = "hackos.submission.draft";

export function saveDraftLocally(data: Record<string, unknown>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

export function loadDraftLocally(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clearDraftLocally() {
  localStorage.removeItem(DRAFT_KEY);
}
