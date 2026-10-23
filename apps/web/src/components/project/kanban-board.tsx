"use client";

import { useMemo, useState } from "react";
import { KANBAN_COLUMNS, type KanbanColumnKey } from "@hackos/shared";
import { cn } from "@/lib/utils";
import type { ColumnStat, ProjectTask } from "./project-types";
import { TaskCard } from "./task-card";

type KanbanBoardProps = {
  columns: ColumnStat[];
  tasks: ProjectTask[];
  onOpenTask: (task: ProjectTask) => void;
  onMoveTask: (taskId: string, status: KanbanColumnKey) => void;
  draggingId?: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
};

export function KanbanBoard({
  columns,
  tasks,
  onOpenTask,
  onMoveTask,
  draggingId,
  onDragStart,
  onDragEnd,
}: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<KanbanColumnKey | null>(null);
  const columnKeys = useMemo(
    () => KANBAN_COLUMNS.map((c) => c.key),
    [],
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<KanbanColumnKey, ProjectTask[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(
        col.key,
        tasks
          .filter((t) => t.status === col.key)
          .sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [tasks]);

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4"
      role="region"
      aria-label="Kanban board"
    >
      {columns.map((column) => {
        const colTasks = tasksByColumn.get(column.key) ?? [];
        const overWip =
          column.wipLimit != null && colTasks.length > column.wipLimit;
        const isTarget = dropTarget === column.key;

        return (
          <section
            key={column.key}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-2xl border border-white/8 bg-black/20",
              isTarget && "border-sky-400/50 ring-1 ring-sky-400/30",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTarget(column.key);
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              const taskId =
                e.dataTransfer.getData("text/task-id") || draggingId;
              setDropTarget(null);
              onDragEnd();
              if (taskId) onMoveTask(taskId, column.key);
            }}
            aria-label={`${column.label} column`}
          >
            <header className="border-b border-white/8 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">
                  {column.label}
                </h2>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    overWip
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/10 text-muted",
                  )}
                >
                  {colTasks.length}
                  {column.wipLimit != null ? ` / ${column.wipLimit}` : ""}
                </span>
              </div>
              {column.wipLimit != null ? (
                <p className="mt-1 text-[10px] text-muted">
                  WIP limit {column.wipLimit}
                  {overWip ? " — consider finishing work first" : ""}
                </p>
              ) : null}
            </header>

            <div className="flex max-h-[calc(100vh-18rem)] flex-col gap-2 overflow-y-auto p-2">
              {colTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted">
                  Drop tasks here
                </p>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={onOpenTask}
                    onDragStart={onDragStart}
                    onKeyboardMove={onMoveTask}
                    columnKeys={columnKeys}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
