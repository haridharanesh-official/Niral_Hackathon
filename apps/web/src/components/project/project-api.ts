import { fetchJson } from "@/lib/api-client";
import type {
  ProjectTask,
  ProjectTaskDetail,
  ProjectWorkspace,
  TaskFilters,
} from "./project-types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function fetchProjectWorkspace(
  token: string,
): Promise<ProjectWorkspace> {
  return fetchJson<ProjectWorkspace>(`${apiUrl}/api/project/workspace`, {
    headers: authHeaders(token),
  });
}

export async function fetchProjectTask(
  token: string,
  taskId: string,
): Promise<ProjectTaskDetail> {
  return fetchJson<ProjectTaskDetail>(
    `${apiUrl}/api/project/tasks/${taskId}`,
    { headers: authHeaders(token) },
  );
}

export async function createProjectTask(
  token: string,
  body: Record<string, unknown>,
): Promise<ProjectTask> {
  return fetchJson<ProjectTask>(`${apiUrl}/api/project/tasks`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function updateProjectTask(
  token: string,
  taskId: string,
  body: Record<string, unknown>,
): Promise<ProjectTask> {
  return fetchJson<ProjectTask>(`${apiUrl}/api/project/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function moveProjectTask(
  token: string,
  taskId: string,
  status: string,
  position?: number,
): Promise<ProjectTask> {
  return fetchJson<ProjectTask>(`${apiUrl}/api/project/tasks/${taskId}/move`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status, position }),
  });
}

export async function addTaskComment(
  token: string,
  taskId: string,
  body: string,
) {
  return fetchJson(`${apiUrl}/api/project/tasks/${taskId}/comments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
}

export async function addChecklistItem(
  token: string,
  taskId: string,
  title: string,
) {
  return fetchJson(`${apiUrl}/api/project/tasks/${taskId}/checklist`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
}

export async function updateChecklistItem(
  token: string,
  taskId: string,
  itemId: string,
  patch: { title?: string; completed?: boolean },
) {
  return fetchJson(
    `${apiUrl}/api/project/tasks/${taskId}/checklist/${itemId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(patch),
    },
  );
}

export async function seedDemoTasks(token: string) {
  return fetchJson(`${apiUrl}/api/project/seed-demo`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function filterTasks(
  tasks: ProjectTask[],
  filters: TaskFilters,
): ProjectTask[] {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.type && task.type !== filters.type) return false;
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId)
      return false;
    if (filters.sprint && task.sprint !== filters.sprint) return false;
    if (filters.label && !task.labels.includes(filters.label)) return false;
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      const hay = `${task.title} ${task.description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function formatDue(due?: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
