const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function req<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiUrl}/api/project/collaboration${path}`, {
    ...init,
    headers: { ...headers(token), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export type WhiteboardObject = {
  id: string;
  objectType: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  layer: number;
  properties: Record<string, unknown> | null;
};

export type Whiteboard = {
  id: string;
  title: string;
  templateId?: string | null;
  zoom: number;
  gridMode: boolean;
  snapToGrid: boolean;
  pageIndex: number;
  objects: WhiteboardObject[];
  createdBy?: { id: string; name: string } | null;
  _count?: { objects: number };
};

export type TeamDoc = {
  id: string;
  title: string;
  category: string;
  status: string;
  content: string;
  templateId?: string | null;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
  links?: Array<{
    id: string;
    targetType: string;
    targetId: string;
    label?: string | null;
  }>;
  _count?: { links: number };
};

export type TimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  detail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
  actor?: { id: string; name: string } | null;
};

export type TimelineAnalytics = {
  totalEvents: number;
  byType: Record<string, number>;
  byDay: Record<string, number>;
  insights: {
    mostActiveHour: string;
    mostActiveDay: string;
    documentationFrequency: number;
    taskThroughput: number;
    whiteboardActivity: number;
    note: string;
  };
};

export const listWhiteboards = (token: string) =>
  req<Whiteboard[]>(token, "/whiteboards");

export const getWhiteboard = (token: string, id: string) =>
  req<Whiteboard>(token, `/whiteboards/${id}`);

export const createWhiteboard = (
  token: string,
  body: { title: string; templateId?: string },
) =>
  req<Whiteboard>(token, "/whiteboards", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateWhiteboard = (
  token: string,
  id: string,
  body: Record<string, unknown>,
) =>
  req<Whiteboard>(token, `/whiteboards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const addWhiteboardObject = (
  token: string,
  boardId: string,
  body: Record<string, unknown>,
) =>
  req<WhiteboardObject>(token, `/whiteboards/${boardId}/objects`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateWhiteboardObject = (
  token: string,
  boardId: string,
  objectId: string,
  body: Record<string, unknown>,
) =>
  req<WhiteboardObject>(
    token,
    `/whiteboards/${boardId}/objects/${objectId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );

export const deleteWhiteboardObject = (
  token: string,
  boardId: string,
  objectId: string,
) =>
  req(token, `/whiteboards/${boardId}/objects/${objectId}`, {
    method: "DELETE",
  });

export const convertStickyToTask = (
  token: string,
  boardId: string,
  objectId: string,
) =>
  req(token, `/whiteboards/${boardId}/objects/${objectId}/to-task`, {
    method: "POST",
    body: JSON.stringify({ labels: ["whiteboard"] }),
  });

export const aiWhiteboardSuggest = (
  token: string,
  boardId: string,
  prompt: string,
) =>
  req<{
    suggestions: Array<{
      objectType: string;
      label: string;
      x: number;
      y: number;
      explanation: string;
    }>;
    note: string;
  }>(token, `/whiteboards/${boardId}/ai-suggest`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

export const aiWhiteboardApply = (
  token: string,
  boardId: string,
  suggestions: Array<{
    objectType: string;
    label: string;
    x: number;
    y: number;
  }>,
) =>
  req(token, `/whiteboards/${boardId}/ai-apply`, {
    method: "POST",
    body: JSON.stringify({ suggestions }),
  });

export const listDocuments = (token: string, category?: string) =>
  req<TeamDoc[]>(
    token,
    `/documents${category ? `?category=${category}` : ""}`,
  );

export const getDocument = (token: string, id: string) =>
  req<TeamDoc>(token, `/documents/${id}`);

export const createDocument = (
  token: string,
  body: { title: string; category?: string; templateId?: string; content?: string },
) =>
  req<TeamDoc>(token, "/documents", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateDocument = (
  token: string,
  id: string,
  body: Record<string, unknown>,
) =>
  req<TeamDoc>(token, `/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const addDocumentLink = (
  token: string,
  docId: string,
  body: { targetType: string; targetId: string; label?: string },
) =>
  req(token, `/documents/${docId}/links`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const aiDocumentAssist = (
  token: string,
  docId: string,
  action: string,
) =>
  req<{ suggestion: string; editable: boolean }>(
    token,
    `/documents/${docId}/ai-assist`,
    { method: "POST", body: JSON.stringify({ action }) },
  );

export const listTimeline = (
  token: string,
  query?: { eventType?: string; search?: string },
) => {
  const params = new URLSearchParams();
  if (query?.eventType) params.set("eventType", query.eventType);
  if (query?.search) params.set("search", query.search);
  const q = params.toString();
  return req<TimelineEvent[]>(token, `/timeline${q ? `?${q}` : ""}`);
};

export const fetchTimelineAnalytics = (token: string) =>
  req<TimelineAnalytics>(token, "/timeline/analytics");

export const seedCollaborationDemo = (token: string) =>
  req(token, "/seed-demo", { method: "POST" });
