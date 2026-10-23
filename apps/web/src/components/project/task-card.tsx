"use client";

import {
  MessageSquare,
  Paperclip,
  GripVertical,
} from "lucide-react";
import {
  PRIORITY_META,
  TASK_TYPE_LABELS,
  type KanbanColumnKey,
} from "@hackos/shared";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "./project-types";
import { formatDue } from "./project-api";

type TaskCardProps = {
  task: ProjectTask;
  onOpen: (task: ProjectTask) => void;
  onDragStart: (taskId: string) => void;
  onKeyboardMove?: (taskId: string, status: KanbanColumnKey) => void;
  columnKeys?: KanbanColumnKey[];
};

export function TaskCard({
  task,
  onOpen,
  onDragStart,
  onKeyboardMove,
  columnKeys,
}: TaskCardProps) {
  const priority = PRIORITY_META[task.priority];
  const due = formatDue(task.dueDate);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      className="group cursor-grab rounded-2xl border border-white/10 bg-black/30 p-3 shadow-sm transition hover:border-sky-400/30 active:cursor-grabbing"
      aria-label={`Task ${task.displayId}: ${task.title}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="mt-0.5 h-4 w-4 shrink-0 text-muted opacity-40 group-hover:opacity-80"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="w-full text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-sky-300/80">
              {task.displayId}
            </p>
            <h3 className="mt-0.5 text-sm font-medium text-white line-clamp-2">
              {task.title}
            </h3>
          </button>

          {task.isBlocked ? (
            <span className="mt-1 inline-block rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
              Blocked
            </span>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{
                backgroundColor: `${priority.color}22`,
                color: priority.color,
              }}
            >
              {priority.label}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">
              {TASK_TYPE_LABELS[task.type]}
            </span>
          </div>

          {task.labels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            {task.assignee ? (
              <span className="truncate">@{task.assignee.name.split(" ")[0]}</span>
            ) : (
              <span>Unassigned</span>
            )}
            {task.sprint ? <span>· {task.sprint}</span> : null}
            {due ? (
              <span className={due === "Overdue" ? "text-red-400" : ""}>
                · {due}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400 transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{task.progress}%</span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
            {task.commentCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.commentCount}
              </span>
            ) : null}
            {task.attachmentCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {task.attachmentCount}
              </span>
            ) : null}
            {task.checklistCount > 0 ? (
              <span>☑ {task.checklistCount} items</span>
            ) : null}
          </div>

          {onKeyboardMove && columnKeys && columnKeys.length > 1 ? (
            <label className="mt-2 block text-[10px] text-muted">
              <span className="sr-only">Move task to column</span>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white"
                value={task.status}
                onChange={(e) =>
                  onKeyboardMove(task.id, e.target.value as KanbanColumnKey)
                }
                onClick={(e) => e.stopPropagation()}
              >
                {columnKeys.map((key) => (
                  <option key={key} value={key}>
                    Move to {key.replace(/_/g, " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function TaskCardSkeleton() {
  return (
    <div
      className={cn(
        "h-28 animate-pulse rounded-2xl border border-white/5 bg-white/5",
      )}
    />
  );
}
