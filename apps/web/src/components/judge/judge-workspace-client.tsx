"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Send,
  Star,
  Video,
} from "lucide-react";
import {
  EVALUATION_PROGRESS_SECTIONS,
  JUDGE_BOOKMARK_OPTIONS,
  JUDGE_WORKSPACE_SECTIONS,
  type JudgeWorkspaceSection,
} from "@hackos/shared";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  clearEvaluationDraft,
  fetchJudgeAnalytics,
  fetchJudgeAssignments,
  fetchJudgeDashboard,
  fetchJudgeRubric,
  fetchJudgeWorkspace,
  loadEvaluationDraft,
  saveEvaluation,
  saveEvaluationDraft,
  submitEvaluation,
  toggleJudgeBookmark,
  updateJudgeNote,
} from "./judge-api";
import type {
  JudgeAssignmentItem,
  JudgeDashboard,
  JudgeScores,
  JudgeWorkspace,
} from "./judge-types";

const SCORE_KEYS = [
  "innovation",
  "technical",
  "presentation",
  "scalability",
  "impact",
  "ui",
  "business",
] as const;

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function historyLabel(action: string) {
  return action
    .replace("evaluation.", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function JudgeWorkspaceClient() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [section, setSection] = useState<JudgeWorkspaceSection>("dashboard");
  const [dashboard, setDashboard] = useState<JudgeDashboard | null>(null);
  const [assignments, setAssignments] = useState<JudgeAssignmentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<JudgeWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("time");
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof fetchJudgeAnalytics>> | null>(null);
  const [rubric, setRubric] = useState<Awaited<ReturnType<typeof fetchJudgeRubric>> | null>(null);

  const [scores, setScores] = useState<JudgeScores>({
    innovation: 0,
    technical: 0,
    presentation: 0,
    scalability: 0,
    impact: 0,
    ui: 0,
    business: 0,
  });
  const [comments, setComments] = useState("");
  const [note, setNote] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const [dash, queue] = await Promise.all([
      fetchJudgeDashboard(token),
      fetchJudgeAssignments(token, { sort }),
    ]);
    setDashboard(dash);
    setAssignments(queue);
    if (!selectedId && queue.length > 0) setSelectedId(queue[0].id);
  }, [token, sort, selectedId]);

  const loadWorkspace = useCallback(
    async (assignmentId: string) => {
      if (!token) return;
      const data = await fetchJudgeWorkspace(token, assignmentId);
      setWorkspace(data);
      setScores({
        innovation: data.evaluation.innovation,
        technical: data.evaluation.technical,
        presentation: data.evaluation.presentation,
        scalability: data.evaluation.scalability,
        impact: data.evaluation.impact,
        ui: data.evaluation.ui,
        business: data.evaluation.business,
      });
      setComments(data.evaluation.comments ?? "");
      setNote(data.note);

      const draft = loadEvaluationDraft(assignmentId) as {
        scores?: JudgeScores;
        comments?: string;
      } | null;
      if (draft && data.evaluation.status !== "SUBMITTED") {
        if (draft.scores) setScores((prev) => ({ ...prev, ...draft.scores }));
        if (draft.comments) setComments(draft.comments);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        setError(null);
        await loadDashboard();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load judge dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, loadDashboard]);

  useEffect(() => {
    if (!token || !selectedId) return;
    void loadWorkspace(selectedId).catch(() => setWorkspace(null));
  }, [token, selectedId, loadWorkspace]);

  useEffect(() => {
    if (!token || section !== "analytics") return;
    void fetchJudgeAnalytics(token).then(setAnalytics).catch(() => setAnalytics(null));
  }, [token, section]);

  useEffect(() => {
    if (!token || section !== "rubrics") return;
    void fetchJudgeRubric(token).then(setRubric).catch(() => setRubric(null));
  }, [token, section]);

  useEffect(() => {
    if (!token) return;
    void fetchJudgeAssignments(token, { sort }).then(setAssignments).catch(() => undefined);
  }, [token, sort]);

  const scheduleAutoSave = useCallback(
    (assignmentId: string, nextScores: JudgeScores, nextComments: string) => {
      saveEvaluationDraft(assignmentId, { scores: nextScores, comments: nextComments });
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        if (!token || workspace?.evaluation.status === "SUBMITTED") return;
        setSaving(true);
        try {
          await saveEvaluation(token, assignmentId, {
            ...nextScores,
            comments: nextComments,
          });
          await loadWorkspace(assignmentId);
        } catch {
          /* local draft retained */
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [token, workspace?.evaluation.status, loadWorkspace],
  );

  const handleScoreChange = (key: keyof JudgeScores, value: number) => {
    if (!selectedId) return;
    setScores((prev) => {
      const next = { ...prev, [key]: value };
      scheduleAutoSave(selectedId, next, comments);
      return next;
    });
  };

  const handleCommentsChange = (value: string) => {
    setComments(value);
    if (selectedId) scheduleAutoSave(selectedId, scores, value);
  };

  const handleNoteBlur = async () => {
    if (!token || !selectedId) return;
    await updateJudgeNote(token, selectedId, note);
  };

  const handleSubmit = async () => {
    if (!token || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveEvaluation(token, selectedId, { ...scores, comments });
      await submitEvaluation(token, selectedId);
      clearEvaluationDraft(selectedId);
      await loadDashboard();
      await loadWorkspace(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = assignments.find((a) => a.id === selectedId);
  const submitted = workspace?.evaluation.status === "SUBMITTED";
  const progress = workspace?.evaluation.progressPercent ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading judge workspace…
      </div>
    );
  }

  if (!token) {
    return (
      <Panel title="Sign in required" description="Log in with a judge account to continue.">
        <p className="text-sm text-muted">Judge credentials are required for this workspace.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-sky-300/80">Judge Evaluation Platform</p>
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          Welcome{dashboard ? `, ${dashboard.judge.name}` : ""}
        </h1>
        {saving ? (
          <p className="mt-1 text-xs text-muted">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            Autosaving evaluation…
          </p>
        ) : workspace?.evaluation.lastSavedAt ? (
          <p className="mt-1 text-xs text-muted">
            Last saved {new Date(workspace.evaluation.lastSavedAt).toLocaleString()}
          </p>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-2">
        {JUDGE_WORKSPACE_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              section === s.key
                ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/40"
                : "bg-white/5 text-muted hover:bg-white/10 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {section === "dashboard" && dashboard ? (
        <Panel title="Judge Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatChip label="Assigned Projects" value={dashboard.stats.assigned} />
            <StatChip label="Reviewed" value={dashboard.stats.reviewed} />
            <StatChip label="Pending" value={dashboard.stats.pending} />
            <StatChip label="Avg Review Time" value={`${dashboard.stats.avgReviewMinutes} min`} />
          </div>
          <p className="mt-4 text-sm text-muted">
            Current round: <span className="text-white">{dashboard.stats.currentRound}</span>
          </p>
          {dashboard.schedule.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-white">Today&apos;s Schedule</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {dashboard.schedule.map((item) => (
                  <li key={item.id}>
                    {formatTime(item.time)} — {item.projectTitle} ({item.teamName})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {(section === "assigned" || section === "queue" || section === "live") ? (
        <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
          <Panel title="Assigned Projects">
            <label className="mb-3 block text-xs text-muted">
              Sort by
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="time">Time</option>
                <option value="theme">Theme</option>
                <option value="priority">Priority</option>
                <option value="status">Completion Status</option>
                <option value="team">Team Number</option>
              </select>
            </label>
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setSection("live");
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                      selectedId === a.id
                        ? "bg-sky-500/15 text-sky-100"
                        : "text-muted hover:bg-white/5"
                    }`}
                  >
                    <span className="font-medium text-white">{a.projectTitle}</span>
                    <span className="mt-0.5 block text-xs">
                      {a.teamName} · {a.theme ?? "General"}
                    </span>
                    <span className="mt-1 block text-[11px]">
                      {a.status} · v{a.submissionVersion} · {a.reviewProgress}%
                    </span>
                  </button>
                </li>
              ))}
              {assignments.length === 0 ? (
                <li className="text-sm text-muted">No assignments yet.</li>
              ) : null}
            </ul>
          </Panel>

          {selected && workspace ? (
            <EvaluationWorkspace
              workspace={workspace}
              scores={scores}
              comments={comments}
              note={note}
              setNote={setNote}
              submitted={submitted}
              progress={progress}
              saving={saving}
              submitting={submitting}
              onScoreChange={handleScoreChange}
              onCommentsChange={handleCommentsChange}
              onNoteBlur={handleNoteBlur}
              onSubmit={handleSubmit}
              onBookmark={async (label) => {
                if (!token || !selectedId) return;
                await toggleJudgeBookmark(token, selectedId, label);
                await loadWorkspace(selectedId);
              }}
            />
          ) : (
            <Panel title="Select a project" description="Choose an assigned project to begin evaluation.">
              <p className="text-sm text-muted">No project currently active.</p>
            </Panel>
          )}
        </div>
      ) : null}

      {section === "rubrics" ? (
        <Panel title="Evaluation Rubric">
          <ul className="space-y-3">
            {(Array.isArray(rubric) ? rubric : workspace?.rubric ?? []).map(
              (c: { key: string; label: string; description: string; weight: number; maxScore: number }) => (
                <li key={c.key} className="rounded-xl border border-white/8 bg-black/20 p-4 text-sm">
                  <p className="font-medium text-white">{c.label}</p>
                  <p className="mt-1 text-muted">{c.description}</p>
                  <p className="mt-2 text-xs text-sky-200">
                    Weight {c.weight} · Max {c.maxScore}
                  </p>
                </li>
              ),
            )}
          </ul>
        </Panel>
      ) : null}

      {section === "analytics" && analytics ? (
        <Panel title="Evaluation Analytics">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatChip label="Submitted Evaluations" value={(analytics as any).submittedEvaluations ?? 0} />
            {((analytics as any).byStatus ?? []).map((s: { status: string; count: number }) => (
              <StatChip key={s.status} label={s.status} value={s.count} />
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {((analytics as any).averageScores ?? []).map((s: { key: string; label: string; average: number }) => (
              <li key={s.key} className="flex justify-between text-muted">
                <span>{s.label}</span>
                <span className="text-white">{s.average}/10</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {section === "schedule" && dashboard ? (
        <Panel title="Evaluation Schedule">
          <ul className="space-y-2 text-sm">
            {dashboard.schedule.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                <Clock className="h-4 w-4 text-sky-300" />
                <span>{formatTime(item.time)}</span>
                <span className="text-white">{item.projectTitle}</span>
                <span className="text-muted">({item.teamName})</span>
              </li>
            ))}
            {dashboard.schedule.length === 0 ? (
              <li className="text-muted">No scheduled demos.</li>
            ) : null}
          </ul>
        </Panel>
      ) : null}

      {section === "notes" && workspace ? (
        <Panel title="Private Judge Notes">
          <textarea
            className="min-h-48 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={note}
            disabled={submitted}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void handleNoteBlur()}
            placeholder="Technical observations, questions, follow-up flags…"
          />
          <p className="mt-2 text-xs text-muted">Notes are private and not visible to participants.</p>
        </Panel>
      ) : null}

      {section === "results" ? (
        <Panel title="Results" description="Final rankings are published by the jury coordinator after review.">
          <p className="text-sm text-muted">
            {assignments.filter((a) => a.status === "REVIEWED").length} of{" "}
            {assignments.length} evaluations submitted.
          </p>
        </Panel>
      ) : null}

      {section === "settings" ? (
        <Panel title="Judge Settings">
          <ul className="space-y-2 text-sm text-muted">
            <li>Anonymous judging: {workspace?.config.anonymousJudging ? "On" : "Off"}</li>
            <li>Downloads: {workspace?.config.allowDownloads ? "Allowed" : "Restricted"}</li>
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function EvaluationWorkspace({
  workspace,
  scores,
  comments,
  note,
  setNote,
  submitted,
  progress,
  saving,
  submitting,
  onScoreChange,
  onCommentsChange,
  onNoteBlur,
  onSubmit,
  onBookmark,
}: {
  workspace: JudgeWorkspace;
  scores: JudgeScores;
  comments: string;
  note: string;
  setNote: (n: string) => void;
  submitted: boolean;
  progress: number;
  saving: boolean;
  submitting: boolean;
  onScoreChange: (key: keyof JudgeScores, value: number) => void;
  onCommentsChange: (value: string) => void;
  onNoteBlur: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onBookmark: (label: string) => Promise<void>;
}) {
  const completed = new Set(
    Array.isArray(workspace.evaluation.sectionsCompleted)
      ? (workspace.evaluation.sectionsCompleted as string[])
      : [],
  );

  return (
    <div className="space-y-4">
      <Panel title={`${workspace.project.title} · ${workspace.team.name}`}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p><span className="text-muted">Theme:</span> {workspace.team.theme ?? workspace.project.category ?? "—"}</p>
            <p><span className="text-muted">Version:</span> v{workspace.project.version}</p>
            <p><span className="text-muted">Submitted:</span> {workspace.project.submittedAt ? new Date(workspace.project.submittedAt).toLocaleString() : "—"}</p>
            <p>{workspace.project.executiveSummary ?? workspace.project.description}</p>
            <div className="flex flex-wrap gap-2">
              {workspace.project.technologies.map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">Evaluation progress</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-sm text-white">{progress}%</p>
            <ul className="mt-3 space-y-1 text-xs">
              {EVALUATION_PROGRESS_SECTIONS.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  {completed.has(s.key) || progress >= 100 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted" />
                  )}
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {JUDGE_BOOKMARK_OPTIONS.map((b) => {
            const active = workspace.bookmarks.includes(b.key);
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => void onBookmark(b.key)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                  active ? "bg-amber-500/20 text-amber-100" : "bg-white/5 text-muted"
                }`}
              >
                <Bookmark className="h-3 w-3" />
                {b.label}
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[14rem_1fr]">
        <Panel title="Materials">
          <ul className="space-y-2 text-sm">
            {workspace.project.files.map((f) => (
              <li key={f.id}>
                <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <FileText className="h-3.5 w-3.5" /> {f.name}
                </a>
              </li>
            ))}
            {workspace.project.githubUrl ? (
              <li>
                <a href={workspace.project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Repository
                </a>
              </li>
            ) : null}
            {workspace.project.demoUrl ? (
              <li>
                <a href={workspace.project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <Video className="h-3.5 w-3.5" /> Demo Video
                </a>
              </li>
            ) : null}
            {workspace.project.slidesUrl ? (
              <li>
                <a href={workspace.project.slidesUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <FileText className="h-3.5 w-3.5" /> Presentation
                </a>
              </li>
            ) : null}
          </ul>
        </Panel>

        <Panel title="Score Sheet">
          <div className="grid gap-3 sm:grid-cols-2">
            {SCORE_KEYS.map((key) => (
              <label key={key} className="text-sm">
                <span className="capitalize text-muted">{key}</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  disabled={submitted}
                  className="field-input mt-1"
                  value={scores[key]}
                  onChange={(e) => onScoreChange(key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <textarea
            className="field-input mt-4 min-h-28"
            placeholder="Evaluation comments and feedback"
            value={comments}
            disabled={submitted}
            onChange={(e) => onCommentsChange(e.target.value)}
          />
          <textarea
            className="field-input mt-3 min-h-20"
            placeholder="Private notes (not shared with team)"
            value={note}
            disabled={submitted}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void onNoteBlur()}
          />
          {!submitted ? (
            <Button className="mt-3" disabled={submitting || saving} onClick={() => void onSubmit()}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Evaluation
            </Button>
          ) : (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300">
              <Star className="h-4 w-4" /> Evaluation submitted
            </p>
          )}
        </Panel>
      </div>

      {workspace.history.length > 0 ? (
        <Panel title="Evaluation History">
          <ul className="space-y-2 text-sm">
            {workspace.history.map((h, i) => (
              <li key={i} className="flex gap-3 text-muted">
                <span className="shrink-0 font-mono text-xs">
                  {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-white">{historyLabel(h.action)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
