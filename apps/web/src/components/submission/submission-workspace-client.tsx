"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  FileUp,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  COMPLIANCE_DECLARATIONS,
  DeliverableCategory,
  SUBMISSION_LOCKED_STATUSES,
  SUBMISSION_TECHNOLOGY_TAGS,
  SUBMISSION_WORKSPACE_SECTIONS,
  type SubmissionWorkspaceSection,
} from "@hackos/shared";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  acceptCompliance,
  addDeliverable,
  clearDraftLocally,
  createVersion,
  fetchReceipt,
  fetchSubmissionPreview,
  fetchSubmissionWorkspace,
  loadDraftLocally,
  removeDeliverable,
  runValidation,
  saveDraftLocally,
  submitProject,
  updateSubmissionDetails,
} from "./submission-api";
import type { SubmissionData, SubmissionWorkspace } from "./submission-types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDeadline(deadline?: string | null) {
  if (!deadline) return "No deadline set";
  const end = new Date(deadline).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return "Deadline passed";
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m remaining`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isLocked(status: string) {
  return SUBMISSION_LOCKED_STATUSES.includes(status as never);
}

export function SubmissionWorkspaceClient() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const [workspace, setWorkspace] = useState<SubmissionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SubmissionWorkspaceSection>("dashboard");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Awaited<ReturnType<typeof fetchReceipt>> | null>(null);
  const [preview, setPreview] = useState<SubmissionWorkspace | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [details, setDetails] = useState<Partial<SubmissionData>>({});

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await fetchSubmissionWorkspace(token);
      setWorkspace(data);
      setDetails(data.submission);

      const localDraft = loadDraftLocally();
      if (localDraft && !isLocked(data.submission.status)) {
        setDetails((prev) => ({ ...prev, ...localDraft }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load submission workspace");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduleAutoSave = useCallback(
    (next: Partial<SubmissionData>) => {
      saveDraftLocally(next);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(async () => {
        if (!token || isLocked(workspace?.submission.status ?? "DRAFT")) return;
        setSaving(true);
        try {
          await updateSubmissionDetails(token, next);
          await load();
        } catch {
          /* keep local draft */
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [token, workspace?.submission.status, load],
  );

  const handleDetailChange = (field: keyof SubmissionData, value: unknown) => {
    setDetails((prev) => {
      const next = { ...prev, [field]: value };
      scheduleAutoSave(next);
      return next;
    });
  };

  const toggleTechnology = (tag: string) => {
    const current = details.technologies ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    handleDetailChange("technologies", next);
  };

  const handleValidate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await runValidation(token);
      await load();
      setSection("validation");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateSubmissionDetails(token, details);
      await createVersion(token, "Pre-submission snapshot");
      const rec = await submitProject(token, "Final submission");
      setReceipt(rec as any);
      clearDraftLocally();
      await load();
      setSection("submit");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      await load();
      setSection("validation");
    } finally {
      setSubmitting(false);
    }
  };

  const loadPreview = async () => {
    if (!token) return;
    const data = await fetchSubmissionPreview(token);
    setPreview(data);
    setSection("preview");
  };

  const locked = isLocked(workspace?.submission.status ?? "DRAFT");
  const validation = workspace?.validation;
  const checklist = workspace?.checklist ?? [];

  const completedMandatory = useMemo(
    () => checklist.filter((c) => c.mandatory && c.complete).length,
    [checklist],
  );
  const totalMandatory = useMemo(
    () => checklist.filter((c) => c.mandatory).length,
    [checklist],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading submission workspace…
      </div>
    );
  }

  if (!token) {
    return (
      <Panel title="Sign in required" description="Log in to access the submission workspace.">
        <Link href="/login" className="text-cyan-400 hover:underline">
          Go to login
        </Link>
      </Panel>
    );
  }

  if (error && !workspace) {
    return (
      <Panel title="Submission unavailable" description={error}>
        <p className="text-sm text-muted">
          Join or create a team first, then return here to prepare your submission.
        </p>
        <Link href="/dashboard/team" className="mt-3 inline-block text-cyan-400 hover:underline">
          Team workspace →
        </Link>
      </Panel>
    );
  }

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-400/80">Submission Module</p>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Project Submission
          </h1>
          <p className="mt-1 text-sm text-muted">
            {workspace.team.name}
            {workspace.event ? ` · ${workspace.event.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {saving ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          ) : workspace.submission.lastSavedAt ? (
            <span>
              Last saved {new Date(workspace.submission.lastSavedAt).toLocaleString()}
            </span>
          ) : null}
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200">
              <Lock className="h-3 w-3" /> Locked
            </span>
          ) : null}
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {SUBMISSION_WORKSPACE_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              section === s.key
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
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

      {section === "dashboard" ? (
        <Panel
          title="Project Submission Status"
          description="Complete all required deliverables before the deadline."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatChip label="Overall Readiness" value={`${workspace.submission.readinessScore}%`} />
            <StatChip label="Version" value={`v${workspace.submission.currentVersion}`} />
            <StatChip label="Deadline" value={formatDeadline(workspace.deadline)} />
            <StatChip label="Status" value={statusLabel(workspace.submission.status)} />
          </div>

          <ul className="mt-6 space-y-2">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                {item.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
                <span className={item.complete ? "text-white" : "text-muted"}>
                  {item.label}
                  {!item.mandatory ? " (optional)" : ""}
                </span>
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm">
              {validation?.canSubmit ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-muted" />
              )}
              <span>Final Validation</span>
            </li>
          </ul>

          <p className="mt-4 text-xs text-muted">
            Mandatory deliverables: {completedMandatory}/{totalMandatory} complete
          </p>
        </Panel>
      ) : null}

      {section === "details" ? (
        <Panel title="Project Details" description="Basic information judges will see first.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Project Name</span>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                value={details.title ?? ""}
                disabled={locked}
                onChange={(e) => handleDetailChange("title", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Category / Theme</span>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                value={details.category ?? workspace.team.theme ?? ""}
                disabled={locked}
                onChange={(e) => handleDetailChange("category", e.target.value)}
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-muted">Executive Summary</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={details.executiveSummary ?? ""}
              disabled={locked}
              onChange={(e) => handleDetailChange("executiveSummary", e.target.value)}
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="text-muted">Problem Statement</span>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={details.problemStatement ?? ""}
              disabled={locked}
              onChange={(e) => handleDetailChange("problemStatement", e.target.value)}
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="text-muted">Solution & Innovation</span>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={details.solutionSummary ?? details.innovationSummary ?? ""}
              disabled={locked}
              onChange={(e) => {
                handleDetailChange("solutionSummary", e.target.value);
                handleDetailChange("innovationSummary", e.target.value);
              }}
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="text-muted">Expected Impact</span>
            <textarea
              className="mt-1 min-h-16 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={details.expectedImpact ?? ""}
              disabled={locked}
              onChange={(e) => handleDetailChange("expectedImpact", e.target.value)}
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="text-muted">Detailed Description</span>
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={details.description ?? ""}
              disabled={locked}
              onChange={(e) => handleDetailChange("description", e.target.value)}
            />
          </label>

          <div className="mt-4">
            <p className="text-sm text-muted">Technologies Used</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBMISSION_TECHNOLOGY_TAGS.map((tag) => {
                const active = (details.technologies ?? []).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={locked}
                    onClick={() => toggleTechnology(tag)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      active
                        ? "bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/50"
                        : "bg-white/5 text-muted hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>
      ) : null}

      {(section === "deliverables" ||
        section === "documentation" ||
        section === "source-code" ||
        section === "media" ||
        section === "demo-video" ||
        section === "presentation") ? (
        <DeliverableSection
          token={token}
          section={section}
          workspace={workspace}
          locked={locked}
          onRefresh={load}
        />
      ) : null}

      {section === "compliance" ? (
        <Panel title="Compliance Checklist" description="Mandatory declarations before final submission.">
          <ul className="space-y-3">
            {COMPLIANCE_DECLARATIONS.map((item) => {
              const record = workspace.submission.compliance.find(
                (c) => c.declaration === item.key,
              );
              const checked = record?.accepted ?? false;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3"
                >
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={async (e) => {
                        await acceptCompliance(token, item.key, e.target.checked);
                        await load();
                      }}
                    />
                    <span>
                      {item.label}
                      {!item.mandatory ? " (optional)" : ""}
                    </span>
                  </label>
                  {checked ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : item.mandatory ? (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      {section === "validation" ? (
        <Panel title="Validation Report" description="Resolve all errors before submitting.">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">
              Readiness score: <strong className="text-white">{validation?.readinessScore ?? 0}%</strong>
            </p>
            <Button size="sm" variant="outline" disabled={locked || saving} onClick={() => void handleValidate()}>
              Re-run validation
            </Button>
          </div>
          <ul className="space-y-2">
            {(validation?.items ?? []).map((item) => (
              <li
                key={item.key}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  item.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {item.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                )}
                <div>
                  <p className="text-white">{item.label}</p>
                  {item.message ? <p className="text-xs text-muted">{item.message}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {section === "preview" ? (
        <Panel title="Submission Preview" description="Judge-facing package preview.">
          {!preview ? (
            <Button onClick={() => void loadPreview()}>Generate preview</Button>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <h3 className="font-display text-lg text-white">{preview.submission.title}</h3>
                <p className="mt-1 text-muted">{preview.team.name}</p>
                <p className="mt-3">{preview.submission.executiveSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.submission.technologies.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-white">Team Members</h4>
                <ul className="mt-1 text-muted">
                  {preview.team.members.map((m) => (
                    <li key={m.id}>{m.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white">Deliverables</h4>
                <ul className="mt-1 text-muted">
                  {preview.submission.files.map((f) => (
                    <li key={f.id}>
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                        {f.name}
                      </a>
                      {" "}({f.category})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Panel>
      ) : null}

      {section === "submit" ? (
        <Panel title="Submit Project" description="Complete validation, preview, then confirm submission.">
          {receipt || workspace.submission.receiptId ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <h3 className="flex items-center gap-2 font-display text-lg text-emerald-200">
                <CheckCircle2 className="h-5 w-5" /> Submission Receipt
              </h3>
              {receipt ? (
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Submission ID</dt><dd className="text-white">{receipt.receiptId}</dd></div>
                  <div><dt className="text-muted">Version</dt><dd className="text-white">v{receipt.version}</dd></div>
                  <div><dt className="text-muted">Event</dt><dd className="text-white">{receipt.eventName}</dd></div>
                  <div><dt className="text-muted">Timestamp</dt><dd className="text-white">{receipt.timestamp ? new Date(receipt.timestamp).toLocaleString() : "—"}</dd></div>
                </dl>
              ) : (
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const rec = await fetchReceipt(token);
                    setReceipt(rec);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Load receipt
                </Button>
              )}
              <p className="mt-4 text-sm text-emerald-100/80">
                Your submission is locked. Organizers have been notified.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ol className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 1. Run validation
                </li>
                <li className="flex items-center gap-2">
                  <FileUp className="h-4 w-4" /> 2. Generate preview
                </li>
                <li className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> 3. Confirm & lock submission
                </li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={saving} onClick={() => void handleValidate()}>
                  Validate
                </Button>
                <Button variant="outline" onClick={() => void loadPreview()}>
                  Preview
                </Button>
                <Button
                  disabled={!validation?.canSubmit || submitting || locked}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Confirm Submission
                </Button>
              </div>
            </div>
          )}
        </Panel>
      ) : null}

      {workspace.submission.versions.length > 0 ? (
        <Panel title="Version History" description="Each save creates a restorable snapshot before deadline.">
          <ul className="space-y-2 text-sm">
            {workspace.submission.versions.map((v) => (
              <li key={v.versionNumber} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>
                  v{v.versionNumber} — {v.changeSummary ?? "Update"}
                </span>
                <span className="text-xs text-muted">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function DeliverableSection({
  token,
  section,
  workspace,
  locked,
  onRefresh,
}: {
  token: string;
  section: SubmissionWorkspaceSection;
  workspace: SubmissionWorkspace;
  locked: boolean;
  onRefresh: () => Promise<void>;
}) {
  const categoryMap: Partial<Record<SubmissionWorkspaceSection, DeliverableCategory>> = {
    documentation: DeliverableCategory.DOCUMENTS,
    "source-code": DeliverableCategory.SOURCE_CODE,
    media: DeliverableCategory.IMAGES,
    "demo-video": DeliverableCategory.VIDEOS,
    presentation: DeliverableCategory.PRESENTATION,
  };

  const requirementMap: Partial<Record<SubmissionWorkspaceSection, string>> = {
    documentation: "documentation",
    "source-code": "source_code",
    "demo-video": "demo_video",
    presentation: "presentation",
  };

  const category = categoryMap[section];
  const requirementKey = requirementMap[section];
  const files =
    section === "deliverables"
      ? workspace.submission.files
      : workspace.submission.files.filter(
          (f) =>
            (category && f.category === category) ||
            (requirementKey && f.requirementKey === requirementKey),
        );

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [reqKey, setReqKey] = useState(requirementKey ?? "");
  const [uploading, setUploading] = useState(false);

  const titles: Record<string, string> = {
    deliverables: "Deliverables",
    documentation: "Documentation",
    "source-code": "Source Code",
    media: "Media Gallery",
    "demo-video": "Demo Video",
    presentation: "Presentation",
  };

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setUploading(true);
    try {
      if (section === "source-code") {
        await updateSubmissionDetails(token, { githubUrl: url, repositoryType: "GIT" });
      } else if (section === "demo-video") {
        await updateSubmissionDetails(token, { demoUrl: url });
      } else if (section === "presentation") {
        await updateSubmissionDetails(token, { slidesUrl: url });
      } else {
        await addDeliverable(token, {
          name,
          url,
          mimeType: "application/octet-stream",
          size: 0,
          category: category ?? DeliverableCategory.DOCUMENTS,
          requirementKey: reqKey || requirementKey,
        });
      }
      setName("");
      setUrl("");
      await onRefresh();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Panel
      title={titles[section] ?? "Deliverables"}
      description="Link files or repositories. Drag-and-drop uploads connect when storage is configured."
    >
      {!locked ? (
        <div className="mb-4 space-y-3">
          {section === "deliverables" ? (
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={reqKey}
              onChange={(e) => setReqKey(e.target.value)}
            >
              <option value="">Select requirement (optional)</option>
              {workspace.checklist.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="File name or label"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="URL (GitHub, Drive, CDN…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button disabled={uploading} onClick={() => void handleAdd()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
          </div>
        </div>
      ) : null}

      <ul className="space-y-2">
        {section === "source-code" && workspace.submission.githubUrl ? (
          <li className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
            <a href={workspace.submission.githubUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              {workspace.submission.githubUrl}
            </a>
            <span className="text-xs text-muted">Repository</span>
          </li>
        ) : null}
        {section === "demo-video" && workspace.submission.demoUrl ? (
          <li className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
            <a href={workspace.submission.demoUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              Demo video
            </a>
          </li>
        ) : null}
        {section === "presentation" && workspace.submission.slidesUrl ? (
          <li className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
            <a href={workspace.submission.slidesUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              Presentation slides
            </a>
          </li>
        ) : null}
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm"
          >
            <div>
              <a href={f.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                {f.name}
              </a>
              <p className="text-xs text-muted">
                {f.category} · {formatBytes(f.size)}
                {f.validationStatus === "INVALID" ? ` · ${f.validationMessage}` : ""}
              </p>
            </div>
            {!locked ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await removeDeliverable(token, f.id);
                  await onRefresh();
                }}
              >
                Remove
              </Button>
            ) : null}
          </li>
        ))}
        {files.length === 0 &&
        !(section === "source-code" && workspace.submission.githubUrl) &&
        !(section === "demo-video" && workspace.submission.demoUrl) &&
        !(section === "presentation" && workspace.submission.slidesUrl) ? (
          <li className="text-sm text-muted">No items yet.</li>
        ) : null}
      </ul>
    </Panel>
  );
}
