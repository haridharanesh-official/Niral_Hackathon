"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Search, Sparkles } from "lucide-react";
import {
  PROJECT_WORKSPACE_SECTIONS,
  TASK_PRIORITIES,
  type KanbanColumnKey,
  type ProjectWorkspaceSection,
} from "@hackos/shared";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./kanban-board";
import { TaskDetailPanel } from "./task-detail-panel";
import {
  createProjectTask,
  fetchProjectWorkspace,
  filterTasks,
  moveProjectTask,
  seedDemoTasks,
} from "./project-api";
import {
  fetchExecutionDashboard,
  type ExecutionDashboard,
} from "./execution-api";
import {
  AiManagerPanel,
  DeliverablesPanel,
  DependenciesPanel,
  ExecutionSeedButton,
  IssuesPanel,
  MilestonesPanel,
  ReportsPanel,
  RisksPanel,
  SprintPanel,
} from "./execution-panels";
import { WhiteboardPanel } from "./whiteboard-panel";
import { DocsPanel, TimelinePanel } from "./docs-timeline-panels";
import { listWhiteboards } from "./collaboration-api";
import type { ProjectTask, ProjectWorkspace, TaskFilters } from "./project-types";

const EXECUTION_SECTIONS = new Set([
  "sprint",
  "milestones",
  "dependencies",
  "risks",
  "issues",
  "deliverables",
  "reports",
  "ai-manager",
]);

const COLLAB_SECTIONS = new Set(["whiteboard", "docs", "timeline"]);

export function ProjectWorkspaceClient() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [workspace, setWorkspace] = useState<ProjectWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<ProjectWorkspaceSection>("kanban");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [execution, setExecution] = useState<ExecutionDashboard | null>(null);
  const [boardOptions, setBoardOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const loadExecution = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchExecutionDashboard(token);
      setExecution(data);
    } catch {
      setExecution(null);
    }
  }, [token]);

  const loadBoards = useCallback(async () => {
    if (!token) return;
    try {
      const boards = await listWhiteboards(token);
      setBoardOptions(boards.map((b) => ({ id: b.id, title: b.title })));
    } catch {
      setBoardOptions([]);
    }
  }, [token]);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchProjectWorkspace(token);
      setWorkspace(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!token) return;
    if (section === "overview" || EXECUTION_SECTIONS.has(section)) {
      loadExecution().catch(() => undefined);
    }
    if (section === "docs" || COLLAB_SECTIONS.has(section)) {
      loadBoards().catch(() => undefined);
    }
  }, [token, section, loadExecution, loadBoards]);

  const sectionFilters = useMemo((): TaskFilters => {
    if (section === "backlog") return { ...filters, status: "BACKLOG" };
    return filters;
  }, [section, filters]);

  const visibleTasks = useMemo(() => {
    if (!workspace) return [];
    return filterTasks(workspace.tasks, sectionFilters);
  }, [workspace, sectionFilters]);

  async function handleRefreshAll() {
    await Promise.all([load(), loadExecution()]);
  }

  async function handleMoveTask(taskId: string, status: KanbanColumnKey) {
    if (!token || !workspace) return;
    const existing = workspace.tasks.find((t) => t.id === taskId);
    if (!existing || existing.status === status) return;

    setWorkspace({
      ...workspace,
      tasks: workspace.tasks.map((t) =>
        t.id === taskId ? { ...t, status } : t,
      ),
    });

    try {
      await moveProjectTask(token, taskId, status);
      await handleRefreshAll();
    } catch {
      await handleRefreshAll();
    }
  }

  async function handleCreateTask() {
    if (!token || !newTitle.trim()) return;
    setCreating(true);
    try {
      await createProjectTask(token, {
        title: newTitle.trim(),
        status: section === "backlog" ? "BACKLOG" : "READY",
      });
      setNewTitle("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleSeedDemo() {
    if (!token) return;
    await seedDemoTasks(token);
    await load();
  }

  if (!token) {
    return (
      <Panel title="Sign in required">
        <p className="text-sm text-muted">
          Log in to access your team project workspace.
        </p>
      </Panel>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error?.includes("Join or create a team")) {
    return (
      <Panel title="No team workspace">
        <p className="text-sm text-muted">
          Create or join a team to unlock the project management workspace.
        </p>
        <Link href="/dashboard/team" className="mt-4 inline-block">
          <Button size="sm">Go to Team</Button>
        </Link>
      </Panel>
    );
  }

  if (!workspace) {
    return (
      <Panel title="Workspace unavailable">
        <p className="text-sm text-muted">{error ?? "Try again shortly."}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
            Project workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">
            {workspace.team.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Plan, assign, and track deliverables across your hackathon sprint.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace.stats.total === 0 ? (
            <Button size="sm" variant="outline" onClick={handleSeedDemo}>
              <Sparkles className="mr-1 h-4 w-4" />
              Load demo tasks
            </Button>
          ) : null}
          {token ? (
            <ExecutionSeedButton token={token} onRefresh={handleRefreshAll} />
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task title…"
              className="w-44 bg-transparent text-sm text-white outline-none sm:w-56"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTask().catch(() => undefined);
              }}
            />
            <Button
              size="sm"
              disabled={creating || !newTitle.trim()}
              onClick={handleCreateTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-2"
        aria-label="Project workspace sections"
      >
        {PROJECT_WORKSPACE_SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              section === item.key
                ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40"
                : "bg-white/5 text-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {section === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            <StatChip label="Total tasks" value={workspace.stats.total} />
            <StatChip label="In progress" value={workspace.stats.inProgress} />
            <StatChip label="Completed" value={workspace.stats.completed} />
            <StatChip label="Health" value={`${workspace.stats.health}%`} />
          </div>
          {execution?.activeSprint ? (
            <Panel title="Active sprint snapshot">
              <p className="text-sm text-white">{execution.activeSprint.name}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{
                    width: `${Math.min(100, execution.activeSprint.metrics.progress)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {execution.activeSprint.metrics.completed} of{" "}
                {execution.activeSprint.metrics.total} tasks ·{" "}
                {execution.activeSprint.timeRemaining.label} remaining
              </p>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {section === "kanban" || section === "backlog" ? (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-black/20 p-3">
            <Search className="h-4 w-4 text-muted" aria-hidden />
            <input
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search tasks…"
              className="min-w-[10rem] flex-1 bg-transparent text-sm text-white outline-none"
              aria-label="Search tasks"
            />
            <select
              value={filters.priority ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priority: (e.target.value || undefined) as TaskFilters["priority"],
                }))
              }
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filters.label ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  label: e.target.value || undefined,
                }))
              }
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
              aria-label="Filter by label"
            >
              <option value="">All labels</option>
              {workspace.labels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filters.assigneeId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  assigneeId: e.target.value || undefined,
                }))
              }
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
              aria-label="Filter by assignee"
            >
              <option value="">All assignees</option>
              {workspace.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {section === "kanban" ? (
            <KanbanBoard
              columns={workspace.columns}
              tasks={visibleTasks}
              onOpenTask={setSelectedTask}
              onMoveTask={handleMoveTask}
              draggingId={draggingId}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
            />
          ) : (
            <Panel title="Backlog">
              <ul className="space-y-2">
                {visibleTasks.length === 0 ? (
                  <li className="text-sm text-muted">No matching tasks.</li>
                ) : (
                  visibleTasks.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-left hover:border-sky-400/30"
                      >
                        <span className="font-mono text-xs text-sky-300">
                          {task.displayId}
                        </span>
                        <p className="text-sm text-white">{task.title}</p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          )}
        </>
      ) : null}

      {section === "whiteboard" && token ? (
        <WhiteboardPanel token={token} onTaskCreated={handleRefreshAll} />
      ) : null}

      {section === "docs" && token ? (
        <DocsPanel
          token={token}
          tasks={workspace.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            displayId: t.displayId,
          }))}
          milestones={execution?.milestones ?? []}
          whiteboards={boardOptions}
        />
      ) : null}

      {section === "timeline" && token ? (
        <TimelinePanel token={token} />
      ) : null}

      {EXECUTION_SECTIONS.has(section) ? (
        execution && token ? (
          <>
            {section === "sprint" ? (
              <SprintPanel
                token={token}
                data={execution}
                workspace={workspace}
                onRefresh={handleRefreshAll}
                onOpenTask={setSelectedTask}
                onMoveTask={handleMoveTask}
              />
            ) : null}
            {section === "milestones" ? (
              <MilestonesPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "deliverables" ? (
              <DeliverablesPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "dependencies" ? (
              <DependenciesPanel
                token={token}
                data={execution}
                workspace={workspace}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "risks" ? (
              <RisksPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "issues" ? (
              <IssuesPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "reports" ? (
              <ReportsPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
            {section === "ai-manager" ? (
              <AiManagerPanel
                token={token}
                data={execution}
                onRefresh={handleRefreshAll}
              />
            ) : null}
          </>
        ) : (
          <Panel title="Loading execution data">
            <p className="text-sm text-muted">Fetching sprint and analytics…</p>
          </Panel>
        )
      ) : null}

      {selectedTask && token ? (
        <TaskDetailPanel
          taskId={selectedTask.id}
          token={token}
          members={workspace.members}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleRefreshAll}
        />
      ) : null}
    </div>
  );
}
