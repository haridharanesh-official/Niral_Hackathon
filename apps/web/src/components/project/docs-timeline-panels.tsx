"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TEMPLATES,
  TIMELINE_EVENT_TYPES,
} from "@hackos/shared";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  addDocumentLink,
  aiDocumentAssist,
  createDocument,
  fetchTimelineAnalytics,
  getDocument,
  listDocuments,
  listTimeline,
  updateDocument,
  type TeamDoc,
  type TimelineAnalytics,
  type TimelineEvent,
} from "./collaboration-api";

type DocsPanelProps = {
  token: string;
  tasks?: Array<{ id: string; title: string; displayId?: string }>;
  milestones?: Array<{ id: string; title: string }>;
  whiteboards?: Array<{ id: string; title: string }>;
};

export function DocsPanel({
  token,
  tasks = [],
  milestones = [],
  whiteboards = [],
}: DocsPanelProps) {
  const [docs, setDocs] = useState<TeamDoc[]>([]);
  const [active, setActive] = useState<TeamDoc | null>(null);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(active?.content ?? "");

  const refresh = useCallback(async () => {
    const list = await listDocuments(token, category || undefined);
    setDocs(list);
    return list;
  }, [token, category]);

  useEffect(() => {
    refresh()
      .then((list) => {
        if (list[0] && !active) {
          return getDocument(token, list[0].id).then(setActive);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    contentRef.current = active?.content ?? "";
  }, [active?.id, active?.content]);

  function scheduleAutosave(content: string) {
    if (!active) return;
    contentRef.current = content;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      setSaving(true);
      updateDocument(token, active.id, { content })
        .then((doc) => {
          setActive(doc);
          setSavedAt(new Date().toLocaleTimeString());
        })
        .finally(() => setSaving(false));
    }, 1200);
  }

  async function openDoc(id: string) {
    const doc = await getDocument(token, id);
    setActive(doc);
  }

  async function handleCreate(templateId?: string) {
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
    const doc = await createDocument(token, {
      title: template?.label ?? "Untitled document",
      templateId,
      category: template?.category,
    });
    await refresh();
    setActive(doc);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="space-y-3">
        <Panel title="Documents">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-2 w-full rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <ul className="space-y-1">
            {docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => openDoc(d.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                    active?.id === d.id
                      ? "bg-sky-500/15 text-sky-100"
                      : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <p className="truncate">{d.title}</p>
                  <p className="text-[10px] opacity-70">{d.category}</p>
                </button>
              </li>
            ))}
          </ul>
          <Button size="sm" className="mt-3 w-full" onClick={() => handleCreate()}>
            New document
          </Button>
        </Panel>

        <Panel title="Templates">
          <ul className="space-y-1">
            {DOCUMENT_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleCreate(t.id)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted hover:bg-white/5 hover:text-white"
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="space-y-3">
        {!active ? (
          <Panel title="Document editor">
            <p className="text-sm text-muted">
              Select or create a document to start writing.
            </p>
          </Panel>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={active.title}
                onChange={(e) =>
                  setActive({ ...active, title: e.target.value })
                }
                onBlur={() =>
                  updateDocument(token, active.id, { title: active.title })
                }
                className="min-w-[12rem] flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-display text-lg text-white"
                aria-label="Document title"
              />
              <select
                value={active.status}
                onChange={(e) =>
                  updateDocument(token, active.id, {
                    status: e.target.value,
                  }).then(setActive)
                }
                className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-xs text-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In review</option>
                <option value="FINAL">Final</option>
              </select>
              <span className="text-[10px] text-muted">
                {saving ? "Saving…" : savedAt ? `Saved ${savedAt}` : "Autosave on"}
              </span>
            </div>

            <textarea
              defaultValue={active.content}
              key={active.id}
              onChange={(e) => scheduleAutosave(e.target.value)}
              className="min-h-[24rem] w-full rounded-3xl border border-white/10 bg-black/40 p-4 font-mono text-sm leading-relaxed text-white outline-none focus:border-sky-400/40"
              aria-label="Document content"
              spellCheck
            />

            <div className="flex flex-wrap gap-2">
              {["summarize", "headings", "expand", "grammar"].map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    aiDocumentAssist(token, active.id, action).then((r) => {
                      if (
                        confirm(
                          "Apply AI suggestion to the document? You can still edit afterward.",
                        )
                      ) {
                        updateDocument(token, active.id, {
                          content: r.suggestion,
                        }).then(setActive);
                      }
                    })
                  }
                >
                  AI: {action}
                </Button>
              ))}
            </div>

            <Panel title="Linked objects">
              <ul className="mb-3 space-y-1 text-xs">
                {(active.links ?? []).map((link) => (
                  <li key={link.id} className="text-muted">
                    {link.label ?? link.targetType} → {link.targetId.slice(0, 8)}…
                  </li>
                ))}
                {(active.links ?? []).length === 0 ? (
                  <li className="text-muted">No links yet.</li>
                ) : null}
              </ul>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
                  defaultValue=""
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(":");
                    if (!type || !id) return;
                    addDocumentLink(token, active.id, {
                      targetType: type,
                      targetId: id,
                      label: e.target.selectedOptions[0]?.text,
                    }).then(() => openDoc(active.id));
                    e.target.value = "";
                  }}
                  aria-label="Link to object"
                >
                  <option value="">Link task / milestone / board…</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={`task:${t.id}`}>
                      Task: {t.displayId ?? ""} {t.title}
                    </option>
                  ))}
                  {milestones.map((m) => (
                    <option key={m.id} value={`milestone:${m.id}`}>
                      Milestone: {m.title}
                    </option>
                  ))}
                  {whiteboards.map((b) => (
                    <option key={b.id} value={`whiteboard:${b.id}`}>
                      Board: {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

type TimelinePanelProps = {
  token: string;
};

export function TimelinePanel({ token }: TimelinePanelProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [analytics, setAnalytics] = useState<TimelineAnalytics | null>(null);
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const [ev, an] = await Promise.all([
      listTimeline(token, {
        eventType: eventType || undefined,
        search: search || undefined,
      }),
      fetchTimelineAnalytics(token),
    ]);
    setEvents(ev);
    setAnalytics(an);
  }, [token, eventType, search]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return (
    <div className="space-y-4">
      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip label="Total events" value={analytics.totalEvents} />
          <StatChip
            label="Task events"
            value={analytics.insights.taskThroughput}
          />
          <StatChip
            label="Doc updates"
            value={analytics.insights.documentationFrequency}
          />
          <StatChip
            label="Whiteboard"
            value={analytics.insights.whiteboardActivity}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timeline…"
          className="min-w-[12rem] flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          aria-label="Search timeline"
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-xs text-white"
          aria-label="Filter by event type"
        >
          <option value="">All types</option>
          {TIMELINE_EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <Panel title="Activity timeline">
        {events.length === 0 ? (
          <p className="text-sm text-muted">
            No events yet. Whiteboard, docs, and task activity will appear here.
          </p>
        ) : (
          <ol className="relative space-y-0 border-l border-white/10 pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative pb-5">
                <span className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                <p className="font-mono text-[10px] text-sky-300">
                  {new Date(e.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-white">{e.title}</p>
                <p className="text-xs text-muted">
                  {e.eventType}
                  {e.actor ? ` · ${e.actor.name}` : ""}
                  {e.targetType ? ` · ${e.targetType}` : ""}
                </p>
                {e.detail ? (
                  <p className="mt-1 text-xs text-muted">{e.detail}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {analytics ? (
        <Panel title="Timeline analytics">
          <p className="text-sm text-white">
            Peak hour: {analytics.insights.mostActiveHour}
          </p>
          <p className="mt-1 text-sm text-white">
            Peak day: {analytics.insights.mostActiveDay}
          </p>
          <p className="mt-3 text-xs text-muted">{analytics.insights.note}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(analytics.byType).map(([type, count]) => (
              <span
                key={type}
                className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-muted"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
