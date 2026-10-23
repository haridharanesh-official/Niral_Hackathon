"use client";

import { useEffect, useState } from "react";
import { X, Send, Plus, History } from "lucide-react";
import {
  KANBAN_COLUMNS,
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_TYPE_LABELS,
  TASK_TYPES,
} from "@hackos/shared";
import { Button } from "@/components/ui/button";
import type { ProjectMember, ProjectTaskDetail } from "./project-types";
import {
  addChecklistItem,
  addTaskComment,
  fetchProjectTask,
  updateChecklistItem,
  updateProjectTask,
} from "./project-api";

type TaskDetailPanelProps = {
  taskId: string;
  token: string;
  members: ProjectMember[];
  onClose: () => void;
  onUpdated: () => void;
};

export function TaskDetailPanel({
  taskId,
  token,
  members,
  onClose,
  onUpdated,
}: TaskDetailPanelProps) {
  const [task, setTask] = useState<ProjectTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProjectTask(token, taskId)
      .then((data) => {
        if (!cancelled) setTask(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, token]);

  async function saveField(patch: Record<string, unknown>) {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateProjectTask(token, task.id, patch);
      setTask((prev) => (prev ? { ...prev, ...updated } : prev));
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function submitComment() {
    if (!task || !comment.trim()) return;
    await addTaskComment(token, task.id, comment.trim());
    setComment("");
    const refreshed = await fetchProjectTask(token, task.id);
    setTask(refreshed);
    onUpdated();
  }

  async function addChecklist() {
    if (!task || !checklistTitle.trim()) return;
    await addChecklistItem(token, task.id, checklistTitle.trim());
    setChecklistTitle("");
    const refreshed = await fetchProjectTask(token, task.id);
    setTask(refreshed);
    onUpdated();
  }

  async function toggleChecklist(itemId: string, completed: boolean) {
    if (!task) return;
    await updateChecklistItem(token, task.id, itemId, { completed });
    const refreshed = await fetchProjectTask(token, task.id);
    setTask(refreshed);
    onUpdated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Task details"
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0f1a] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-xs text-sky-300">
              {task?.displayId ?? "…"}
            </p>
            <h2 className="font-display text-lg font-semibold text-white">
              {task?.title ?? "Loading task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-white/10 hover:text-white"
            aria-label="Close task panel"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {loading || !task ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Loading…
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  value={task.status}
                  disabled={saving}
                  onChange={(e) => saveField({ status: e.target.value })}
                >
                  {KANBAN_COLUMNS.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted">
                Priority
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  value={task.priority}
                  disabled={saving}
                  onChange={(e) => saveField({ priority: e.target.value })}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted">
                Type
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  value={task.type}
                  disabled={saving}
                  onChange={(e) => saveField({ type: e.target.value })}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TASK_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-muted">
                Assignee
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  value={task.assigneeId ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    saveField({
                      assigneeId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs text-muted">
              Description
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                defaultValue={task.description ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (task.description ?? "")) {
                    saveField({ description: e.target.value });
                  }
                }}
              />
            </label>

            <label className="block text-xs text-muted">
              Acceptance criteria
              <textarea
                className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                defaultValue={task.acceptanceCriteria ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (task.acceptanceCriteria ?? "")) {
                    saveField({ acceptanceCriteria: e.target.value });
                  }
                }}
              />
            </label>

            <section>
              <h3 className="text-sm font-semibold text-white">Checklist</h3>
              <ul className="mt-2 space-y-2">
                {task.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) =>
                        toggleChecklist(item.id, e.target.checked)
                      }
                      className="rounded border-white/20"
                    />
                    <span
                      className={
                        item.completed ? "text-muted line-through" : "text-white"
                      }
                    >
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  placeholder="Add checklist item"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
                <Button size="sm" type="button" onClick={addChecklist}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-white">Discussion</h3>
              <div className="mt-2 space-y-3">
                {task.comments.length === 0 ? (
                  <p className="text-xs text-muted">No comments yet.</p>
                ) : (
                  task.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-white/8 bg-black/20 p-3"
                    >
                      <p className="text-xs text-sky-300">{c.author.name}</p>
                      <p className="mt-1 text-sm text-white">{c.body}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment().catch(() => undefined);
                    }
                  }}
                />
                <Button size="sm" type="button" onClick={submitComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <History className="h-4 w-4" />
                History
              </h3>
              <ul className="mt-2 space-y-2">
                {task.history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-white/5 px-3 py-2 text-xs"
                  >
                    <p className="text-white">
                      {entry.actor?.name ?? "System"}{" "}
                      <span className="text-muted">{entry.action}</span>
                    </p>
                    {entry.detail ? (
                      <p className="mt-0.5 text-muted">{entry.detail}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
