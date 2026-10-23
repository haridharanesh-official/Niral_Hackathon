const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function get<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${apiUrl}/api/project/execution${path}`, {
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
  const res = await fetch(`${apiUrl}/api/project/execution${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function fetchExecutionDashboard(token: string) {
  return get<ExecutionDashboard>(token, "/dashboard");
}

export function createSprint(token: string, body: Record<string, unknown>) {
  return mutate(token, "/sprints", "POST", body);
}

export function activateSprint(token: string, sprintId: string) {
  return mutate(token, `/sprints/${sprintId}/activate`, "POST");
}

export function createMilestone(token: string, body: Record<string, unknown>) {
  return mutate(token, "/milestones", "POST", body);
}

export function seedMilestones(token: string) {
  return mutate(token, "/milestones/seed", "POST");
}

export function createDeliverable(token: string, body: Record<string, unknown>) {
  return mutate(token, "/deliverables", "POST", body);
}

export function updateDeliverable(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return mutate(token, `/deliverables/${id}`, "PATCH", body);
}

export function createDependency(token: string, body: Record<string, unknown>) {
  return mutate(token, "/dependencies", "POST", body);
}

export function deleteDependency(token: string, id: string) {
  return mutate(token, `/dependencies/${id}`, "DELETE");
}

export function createRisk(token: string, body: Record<string, unknown>) {
  return mutate(token, "/risks", "POST", body);
}

export function createIssue(token: string, body: Record<string, unknown>) {
  return mutate(token, "/issues", "POST", body);
}

export function updateIssue(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return mutate(token, `/issues/${id}`, "PATCH", body);
}

export function recordSprintReview(
  token: string,
  sprintId: string,
  body: Record<string, unknown>,
) {
  return mutate(token, `/sprints/${sprintId}/review`, "POST", body);
}

export function recordSprintRetro(
  token: string,
  sprintId: string,
  body: Record<string, unknown>,
) {
  return mutate(token, `/sprints/${sprintId}/retrospective`, "POST", body);
}

export function seedExecutionDemo(token: string) {
  return mutate(token, "/seed-demo", "POST");
}

export type ExecutionDashboard = {
  team: { id: string; name: string };
  members: Array<{ id: string; name: string; image?: string | null }>;
  activeSprint: {
    id: string;
    name: string;
    goal?: string | null;
    startDate: string;
    endDate: string;
    status: string;
    metrics: {
      total: number;
      completed: number;
      inProgress: number;
      blocked: number;
      progress: number;
    };
    timeRemaining: { hours: number; minutes: number; label: string };
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      isBlocked: boolean;
      assignee?: { name: string } | null;
    }>;
  } | null;
  sprints: Array<{ id: string; name: string; status: string; goal?: string }>;
  milestones: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
    dueDate?: string | null;
    tasks?: Array<{ id: string; title: string }>;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    format?: string | null;
    reviewStatus: string;
    deadline?: string | null;
  }>;
  risks: Array<{
    id: string;
    title: string;
    probability: string;
    impact: string;
    status: string;
    mitigation?: string | null;
    owner?: { name: string } | null;
  }>;
  issues: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    assignee?: { name: string } | null;
  }>;
  dependencies: Array<{
    id: string;
    task: { id: string; title: string; status: string; taskNumber: number };
    dependsOnTask: { id: string; title: string; status: string };
  }>;
  workload: Array<{
    member: { id: string; name: string };
    taskCount: number;
    completed: number;
  }>;
  analytics: {
    burndown: { ideal: number[]; actual: number[]; explanation: string };
    burnup: { totalScope: number; completed: number; explanation: string };
    velocity: { tasksPerSprint: number; label: string };
    capacity: {
      availableHours: number;
      assignedHours: number;
      completedTasks: number;
      remainingTasks: number;
      explanation: string;
    };
  };
  ai: Array<{ type: string; title: string; explanation: string }>;
  predictions: Array<{
    milestoneId: string;
    title: string;
    confidence: number;
    explanation: string;
  }>;
};
