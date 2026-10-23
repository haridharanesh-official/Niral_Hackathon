"use client";

import { useState } from "react";
import { SPRINT_TEMPLATES } from "@hackos/shared";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./kanban-board";
import type { ProjectTask, ProjectWorkspace } from "./project-types";
import type { ExecutionDashboard } from "./execution-api";
import {
  activateSprint,
  createDependency,
  createIssue,
  createMilestone,
  createRisk,
  createSprint,
  recordSprintRetro,
  recordSprintReview,
  seedExecutionDemo,
  seedMilestones,
} from "./execution-api";
import type { KanbanColumnKey } from "@hackos/shared";

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-white/10 ${className ?? ""}`}>
      <div
        className="h-full rounded-full bg-sky-400 transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function MiniChart({
  ideal,
  actual,
  label,
}: {
  ideal: number[];
  actual: number[];
  label: string;
}) {
  const max = Math.max(...ideal, ...actual, 1);
  return (
    <div className="space-y-2" role="img" aria-label={label}>
      <div className="flex h-24 items-end gap-1">
        {ideal.map((v, i) => (
          <div key={`i-${i}`} className="flex flex-1 flex-col justify-end gap-0.5">
            <div
              className="rounded-t bg-white/20"
              style={{ height: `${(v / max) * 100}%` }}
              title={`Ideal: ${v}`}
            />
          </div>
        ))}
      </div>
      <div className="flex h-16 items-end gap-1">
        {actual.map((v, i) => (
          <div key={`a-${i}`} className="flex-1">
            <div
              className="rounded-t bg-sky-400/80"
              style={{ height: `${(v / max) * 100}%` }}
              title={`Actual: ${v}`}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">Gray = ideal path · Blue = actual remaining</p>
    </div>
  );
}

type PanelProps = {
  token: string;
  data: ExecutionDashboard;
  workspace?: ProjectWorkspace | null;
  onRefresh: () => void;
  onOpenTask?: (task: ProjectTask) => void;
  onMoveTask?: (taskId: string, status: KanbanColumnKey) => void;
};

export function SprintPanel({
  token,
  data,
  workspace,
  onRefresh,
  onOpenTask,
  onMoveTask,
}: PanelProps) {
  const [name, setName] = useState("Sprint 3 – AI Detection");
  const [goal, setGoal] = useState("Train and deploy detection pipeline");
  const [reviewNotes, setReviewNotes] = useState("");
  const sprint = data.activeSprint;

  async function handleCreate() {
    const now = new Date();
    const end = new Date(now.getTime() + 8 * 3_600_000);
    await createSprint(token, {
      name,
      goal,
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      capacityHours: 32,
      status: "PLANNED",
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {sprint ? (
        <Panel title="Current sprint">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-xl text-white">{sprint.name}</h3>
              {sprint.goal ? (
                <p className="mt-1 text-sm text-muted">Goal: {sprint.goal}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                {new Date(sprint.startDate).toLocaleString()} →{" "}
                {new Date(sprint.endDate).toLocaleString()}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted">
                  <span>Progress</span>
                  <span>{sprint.metrics.progress}%</span>
                </div>
                <ProgressBar value={sprint.metrics.progress} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-muted">Tasks</p>
                <p className="text-lg text-white">{sprint.metrics.total}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-muted">Completed</p>
                <p className="text-lg text-white">{sprint.metrics.completed}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-muted">In progress</p>
                <p className="text-lg text-white">{sprint.metrics.inProgress}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-muted">Blocked</p>
                <p className="text-lg text-white">{sprint.metrics.blocked}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-black/20 p-3">
                <p className="text-muted">Time remaining</p>
                <p className="text-lg text-white">{sprint.timeRemaining.label}</p>
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title="No active sprint">
          <p className="text-sm text-muted">
            Create a sprint or activate an existing one to start planning.
          </p>
        </Panel>
      )}

      {workspace && sprint && onOpenTask && onMoveTask ? (
        <Panel title="Sprint board">
          <KanbanBoard
            columns={workspace.columns}
            tasks={workspace.tasks.filter((t) =>
              data.activeSprint?.tasks.some((st) => st.id === t.id),
            )}
            onOpenTask={onOpenTask}
            onMoveTask={onMoveTask}
            onDragStart={() => undefined}
            onDragEnd={() => undefined}
          />
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Create sprint">
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              list="sprint-templates"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Sprint name"
            />
            <datalist id="sprint-templates">
              {SPRINT_TEMPLATES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="min-h-16 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              placeholder="Sprint goal"
            />
            <Button size="sm" onClick={handleCreate}>
              Create sprint
            </Button>
          </div>
        </Panel>

        <Panel title="Sprint review & retrospective">
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="What went well? What to improve? Action items?"
          />
          {sprint ? (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  recordSprintReview(token, sprint.id, {
                    completedWork: reviewNotes,
                  }).then(onRefresh)
                }
              >
                Save review
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  recordSprintRetro(token, sprint.id, {
                    wentWell: reviewNotes,
                  }).then(onRefresh)
                }
              >
                Save retro
              </Button>
            </div>
          ) : null}
        </Panel>
      </div>

      {data.sprints.length > 1 ? (
        <Panel title="All sprints">
          <ul className="space-y-2 text-sm">
            {data.sprints.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2"
              >
                <span className="text-white">{s.name}</span>
                <span className="text-muted">{s.status}</span>
                {s.status !== "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => activateSprint(token, s.id).then(onRefresh)}
                  >
                    Activate
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

export function MilestonesPanel({ token, data, onRefresh }: PanelProps) {
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {data.milestones.length === 0 ? (
          <Button size="sm" variant="outline" onClick={() => seedMilestones(token).then(onRefresh)}>
            Seed default milestones
          </Button>
        ) : null}
      </div>
      <Panel title="Project milestones">
        <ul className="space-y-4">
          {data.milestones.map((m) => (
            <li key={m.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white">
                  {m.status === "COMPLETED" ? "✔" : "○"} {m.title}
                </span>
                <span className="text-xs text-muted">{m.progress}%</span>
              </div>
              <ProgressBar value={m.progress} className="mt-2" />
              {m.dueDate ? (
                <p className="mt-1 text-[10px] text-muted">
                  Due {new Date(m.dueDate).toLocaleDateString()}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Add milestone">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="Milestone title"
          />
          <Button
            size="sm"
            disabled={!title.trim()}
            onClick={() =>
              createMilestone(token, { title: title.trim() }).then(() => {
                setTitle("");
                onRefresh();
              })
            }
          >
            Add
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export function DeliverablesPanel({ token, data }: PanelProps) {
  return (
    <Panel title="Deliverables">
      <ul className="space-y-2 text-sm">
        {data.deliverables.length === 0 ? (
          <li className="text-muted">No deliverables yet. Seed demo data from overview.</li>
        ) : (
          data.deliverables.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 px-3 py-2"
            >
              <div>
                <p className="text-white">{d.title}</p>
                <p className="text-xs text-muted">
                  {d.format ?? "Any format"} · {d.reviewStatus}
                </p>
              </div>
              {d.deadline ? (
                <span className="text-xs text-muted">
                  {new Date(d.deadline).toLocaleDateString()}
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}

export function DependenciesPanel({ token, data, workspace, onRefresh }: PanelProps) {
  const [taskId, setTaskId] = useState("");
  const [dependsOn, setDependsOn] = useState("");
  const tasks = workspace?.tasks ?? [];

  return (
    <div className="space-y-4">
      <Panel title="Dependency chain">
        {data.dependencies.length === 0 ? (
          <p className="text-sm text-muted">No dependencies defined.</p>
        ) : (
          <ul className="space-y-3 font-mono text-xs">
            {data.dependencies.map((d) => (
              <li key={d.id} className="rounded-xl border border-white/8 p-3">
                <p className="text-sky-300">{d.dependsOnTask.title}</p>
                <p className="my-1 text-muted">↓</p>
                <p className="text-white">{d.task.title}</p>
                <p className="mt-2 text-[10px] text-muted">
                  Prerequisite: {d.dependsOnTask.status} · Dependent: {d.task.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {tasks.length >= 2 ? (
        <Panel title="Add dependency">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              aria-label="Prerequisite task"
            >
              <option value="">Prerequisite task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayId} {t.title}
                </option>
              ))}
            </select>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              aria-label="Dependent task"
            >
              <option value="">Dependent task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayId} {t.title}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            className="mt-2"
            disabled={!taskId || !dependsOn}
            onClick={() =>
              createDependency(token, {
                taskId,
                dependsOnTaskId: dependsOn,
              }).then(onRefresh)
            }
          >
            Add dependency
          </Button>
        </Panel>
      ) : null}
    </div>
  );
}

export function RisksPanel({ token, data, onRefresh }: PanelProps) {
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-4">
      <Panel title="Risk register">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-2">Risk</th>
                <th className="pb-2">Probability</th>
                <th className="pb-2">Impact</th>
                <th className="pb-2">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {data.risks.map((r) => (
                <tr key={r.id} className="border-t border-white/8">
                  <td className="py-2 text-white">{r.title}</td>
                  <td className="py-2 text-muted">{r.probability}</td>
                  <td className="py-2 text-muted">{r.impact}</td>
                  <td className="py-2 text-muted">{r.mitigation ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Add risk">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="Risk title"
          />
          <Button
            size="sm"
            disabled={!title.trim()}
            onClick={() =>
              createRisk(token, { title: title.trim() }).then(() => {
                setTitle("");
                onRefresh();
              })
            }
          >
            Add
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export function IssuesPanel({ token, data, onRefresh }: PanelProps) {
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-4">
      <Panel title="Issue tracking">
        <ul className="space-y-2">
          {data.issues.length === 0 ? (
            <li className="text-sm text-muted">No issues logged.</li>
          ) : (
            data.issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-xl border border-white/8 px-3 py-2 text-sm"
              >
                <p className="text-white">{issue.title}</p>
                <p className="text-xs text-muted">
                  {issue.severity} · {issue.status}
                  {issue.assignee ? ` · ${issue.assignee.name}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </Panel>
      <Panel title="Report issue">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="Issue title"
          />
          <Button
            size="sm"
            disabled={!title.trim()}
            onClick={() =>
              createIssue(token, { title: title.trim(), severity: "MEDIUM" }).then(
                () => {
                  setTitle("");
                  onRefresh();
                },
              )
            }
          >
            Report
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export function ReportsPanel({ data }: PanelProps) {
  const { analytics, workload } = data;
  const maxTasks = Math.max(...workload.map((w) => w.taskCount), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Burndown chart">
          <MiniChart
            ideal={analytics.burndown.ideal}
            actual={analytics.burndown.actual}
            label="Sprint burndown"
          />
          <p className="mt-2 text-xs text-muted">{analytics.burndown.explanation}</p>
        </Panel>
        <Panel title="Burnup & velocity">
          <p className="text-sm text-white">
            Scope: {analytics.burnup.totalScope} · Completed:{" "}
            {analytics.burnup.completed}
          </p>
          <p className="mt-2 text-xs text-muted">{analytics.burnup.explanation}</p>
          <p className="mt-4 font-display text-2xl text-white">
            {analytics.velocity.tasksPerSprint}
          </p>
          <p className="text-xs text-muted">{analytics.velocity.label}</p>
        </Panel>
      </div>

      <Panel title="Workload balancing">
        <ul className="space-y-3">
          {workload.map((w) => (
            <li key={w.member.id}>
              <div className="flex justify-between text-xs">
                <span className="text-white">{w.member.name}</span>
                <span className="text-muted">{w.taskCount} tasks</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-400"
                  style={{ width: `${(w.taskCount / maxTasks) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Team capacity">
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-muted">Available (est.)</p>
            <p className="text-lg text-white">{analytics.capacity.availableHours}h</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-muted">Assigned</p>
            <p className="text-lg text-white">{analytics.capacity.assignedHours}h</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-muted">Completed</p>
            <p className="text-lg text-white">{analytics.capacity.completedTasks}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-muted">Remaining</p>
            <p className="text-lg text-white">{analytics.capacity.remainingTasks}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{analytics.capacity.explanation}</p>
      </Panel>
    </div>
  );
}

export function AiManagerPanel({ data }: PanelProps) {
  return (
    <div className="space-y-4">
      <Panel title="AI Sprint Manager">
        {data.ai.length === 0 ? (
          <p className="text-sm text-muted">
            No recommendations right now — your sprint looks balanced.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.ai.map((rec, i) => (
              <li
                key={i}
                className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4"
              >
                <p className="text-sm font-medium text-white">{rec.title}</p>
                <p className="mt-1 text-xs text-muted">{rec.explanation}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-sky-300">
                  Optional · {rec.type}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Predictive deadline analysis">
        <ul className="space-y-3">
          {data.predictions.map((p) => (
            <li key={p.milestoneId}>
              <div className="flex justify-between text-sm">
                <span className="text-white">{p.title}</span>
                <span className="text-sky-300">{p.confidence}% confidence</span>
              </div>
              <ProgressBar value={p.confidence} className="mt-2" />
              <p className="mt-1 text-[10px] text-muted">{p.explanation}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function ExecutionSeedButton({
  token,
  onRefresh,
}: {
  token: string;
  onRefresh: () => void;
}) {
  return (
    <Button size="sm" variant="outline" onClick={() => seedExecutionDemo(token).then(onRefresh)}>
      Load sprint demo data
    </Button>
  );
}
