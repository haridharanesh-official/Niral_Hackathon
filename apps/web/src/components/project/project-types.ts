import type {
  KanbanColumnKey,
  TaskPriorityKey,
  TaskTypeKey,
} from "@hackos/shared";

export type ProjectMember = {
  id: string;
  name: string;
  image?: string | null;
};

export type ProjectTask = {
  id: string;
  taskNumber: number;
  displayId: string;
  title: string;
  description?: string | null;
  status: KanbanColumnKey;
  type: TaskTypeKey;
  priority: TaskPriorityKey;
  assigneeId?: string | null;
  assignee?: ProjectMember | null;
  reporter?: ProjectMember | null;
  reviewer?: ProjectMember | null;
  sprint?: string | null;
  milestone?: string | null;
  labels: string[];
  category?: string | null;
  progress: number;
  isBlocked?: boolean;
  acceptanceCriteria?: string | null;
  dueDate?: string | null;
  estimatedEffort?: string | null;
  actualEffort?: string | null;
  position: number;
  commentCount: number;
  attachmentCount: number;
  checklistCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
  position: number;
};

export type TaskComment = {
  id: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  author: ProjectMember;
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
};

export type TaskHistoryEntry = {
  id: string;
  action: string;
  detail?: string | null;
  createdAt: string;
  actor?: ProjectMember | null;
};

export type ProjectTaskDetail = ProjectTask & {
  checklist: ChecklistItem[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  history: TaskHistoryEntry[];
};

export type ColumnStat = {
  key: KanbanColumnKey;
  label: string;
  wipLimit: number | null;
  count: number;
};

export type ProjectWorkspace = {
  team: { id: string; name: string };
  columns: ColumnStat[];
  members: ProjectMember[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    health: number;
  };
  tasks: ProjectTask[];
  labels: string[];
  sprints: string[];
};

export type TaskFilters = {
  priority?: TaskPriorityKey;
  label?: string;
  assigneeId?: string;
  sprint?: string;
  search?: string;
  type?: TaskTypeKey;
  status?: KanbanColumnKey;
};
