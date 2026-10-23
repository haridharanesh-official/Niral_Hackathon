"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WHITEBOARD_ENGINEERING,
  WHITEBOARD_FLOWCHART,
  WHITEBOARD_SHAPES,
  WHITEBOARD_TEMPLATES,
  WHITEBOARD_ZOOM_LEVELS,
} from "@hackos/shared";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import {
  addWhiteboardObject,
  aiWhiteboardApply,
  aiWhiteboardSuggest,
  convertStickyToTask,
  createWhiteboard,
  deleteWhiteboardObject,
  getWhiteboard,
  listWhiteboards,
  seedCollaborationDemo,
  updateWhiteboard,
  updateWhiteboardObject,
  type Whiteboard,
  type WhiteboardObject,
} from "./collaboration-api";

const STICKY_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

function objectLabel(obj: WhiteboardObject) {
  const p = obj.properties ?? {};
  return (
    (typeof p.text === "string" && p.text) ||
    (typeof p.label === "string" && p.label) ||
    obj.objectType
  );
}

function ObjectVisual({ obj }: { obj: WhiteboardObject }) {
  const label = objectLabel(obj);
  const color =
    typeof obj.properties?.color === "string"
      ? obj.properties.color
      : obj.objectType === "sticky"
        ? "#fef08a"
        : "#1e293b";

  if (obj.objectType === "sticky") {
    return (
      <div
        className="h-full w-full overflow-hidden p-2 text-left text-xs text-slate-900 shadow-md"
        style={{ backgroundColor: color }}
      >
        <p className="font-semibold line-clamp-4">{label}</p>
        {typeof obj.properties?.convertedTaskId === "string" ? (
          <p className="mt-1 text-[10px] text-emerald-700">→ Task linked</p>
        ) : null}
      </div>
    );
  }

  if (obj.objectType === "circle" || obj.objectType === "ellipse") {
    return (
      <div
        className="flex h-full w-full items-center justify-center border-2 border-sky-400/60 bg-sky-500/10 text-[10px] text-white"
        style={{ borderRadius: "50%" }}
      >
        {label}
      </div>
    );
  }

  if (obj.objectType === "diamond" || obj.objectType === "decision") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-[70%] w-[70%] rotate-45 items-center justify-center border border-amber-400/50 bg-amber-500/10">
          <span className="-rotate-45 text-[10px] text-white">{label}</span>
        </div>
      </div>
    );
  }

  const engColors: Record<string, string> = {
    sensor: "border-emerald-400/50 bg-emerald-500/10",
    esp32: "border-orange-400/50 bg-orange-500/10",
    "raspberry-pi": "border-rose-400/50 bg-rose-500/10",
    arduino: "border-teal-400/50 bg-teal-500/10",
    cloud: "border-sky-400/50 bg-sky-500/10",
    database: "border-violet-400/50 bg-violet-500/10",
    server: "border-slate-400/50 bg-slate-500/10",
    "api-gateway": "border-cyan-400/50 bg-cyan-500/10",
    camera: "border-pink-400/50 bg-pink-500/10",
    user: "border-lime-400/50 bg-lime-500/10",
  };

  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border px-2 text-center text-[10px] text-white ${
        engColors[obj.objectType] ?? "border-white/20 bg-white/5"
      }`}
    >
      <div>
        <p className="font-mono uppercase tracking-wide opacity-70">
          {obj.objectType}
        </p>
        <p className="mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

type WhiteboardPanelProps = {
  token: string;
  onTaskCreated?: () => void;
};

export function WhiteboardPanel({ token, onTaskCreated }: WhiteboardPanelProps) {
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [board, setBoard] = useState<Whiteboard | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState("select");
  const [aiPrompt, setAiPrompt] = useState("Smart warehouse with Raspberry Pi");
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{
      objectType: string;
      label: string;
      x: number;
      y: number;
      explanation: string;
    }>
  >([]);
  const [panel, setPanel] = useState<
    "layers" | "objects" | "templates" | "ai" | "history"
  >("objects");
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const refreshBoards = useCallback(async () => {
    const list = await listWhiteboards(token);
    setBoards(list);
    return list;
  }, [token]);

  const loadBoard = useCallback(
    async (id: string) => {
      const data = await getWhiteboard(token, id);
      setBoard(data);
    },
    [token],
  );

  useEffect(() => {
    refreshBoards()
      .then((list) => {
        if (list[0]) return loadBoard(list[0].id);
      })
      .catch(() => undefined);
  }, [refreshBoards, loadBoard]);

  async function handleCreate(templateId?: string) {
    const created = await createWhiteboard(token, {
      title: templateId
        ? `${WHITEBOARD_TEMPLATES.find((t) => t.id === templateId)?.label ?? "Board"}`
        : "Brainstorm Board",
      templateId,
    });
    await refreshBoards();
    await loadBoard(created.id);
  }

  async function placeObject(objectType: string, x?: number, y?: number) {
    if (!board) return;
    const snap = board.snapToGrid ? 20 : 1;
    const px = Math.round((x ?? 120 + Math.random() * 200) / snap) * snap;
    const py = Math.round((y ?? 120 + Math.random() * 120) / snap) * snap;
    await addWhiteboardObject(token, board.id, {
      objectType,
      positionX: px,
      positionY: py,
      properties:
        objectType === "sticky"
          ? {
              text: "New idea",
              color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
            }
          : { label: objectType.replace(/-/g, " ") },
    });
    await loadBoard(board.id);
  }

  async function handleCanvasClick(e: React.MouseEvent) {
    if (!board || tool === "select" || tool === "eraser") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / board.zoom;
    const y = (e.clientY - rect.top) / board.zoom;
    await placeObject(tool, x, y);
    setTool("select");
  }

  function onPointerDown(e: React.PointerEvent, obj: WhiteboardObject) {
    if (tool === "eraser") {
      if (!board) return;
      deleteWhiteboardObject(token, board.id, obj.id)
        .then(() => loadBoard(board.id))
        .catch(() => undefined);
      return;
    }
    setSelectedId(obj.id);
    dragRef.current = {
      id: obj.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: obj.positionX,
      origY: obj.positionY,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !board) return;
    const snap = board.snapToGrid ? 20 : 1;
    const dx = (e.clientX - dragRef.current.startX) / board.zoom;
    const dy = (e.clientY - dragRef.current.startY) / board.zoom;
    const nx = Math.round((dragRef.current.origX + dx) / snap) * snap;
    const ny = Math.round((dragRef.current.origY + dy) / snap) * snap;
    setBoard({
      ...board,
      objects: board.objects.map((o) =>
        o.id === dragRef.current!.id
          ? { ...o, positionX: nx, positionY: ny }
          : o,
      ),
    });
  }

  async function onPointerUp() {
    if (!dragRef.current || !board) return;
    const id = dragRef.current.id;
    const obj = board.objects.find((o) => o.id === id);
    dragRef.current = null;
    if (!obj) return;
    await updateWhiteboardObject(token, board.id, id, {
      positionX: obj.positionX,
      positionY: obj.positionY,
    });
  }

  async function setZoom(zoom: number) {
    if (!board) return;
    await updateWhiteboard(token, board.id, { zoom });
    setBoard({ ...board, zoom });
  }

  const selected = board?.objects.find((o) => o.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => loadBoard(b.id)}
              className={`rounded-full px-3 py-1 text-xs ${
                board?.id === b.id
                  ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40"
                  : "bg-white/5 text-muted"
              }`}
            >
              {b.title}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={() => handleCreate()}>
            New board
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              seedCollaborationDemo(token)
                .then(refreshBoards)
                .then((list) => list[0] && loadBoard(list[0].id))
            }
          >
            Seed demo
          </Button>
        </div>
      </div>

      {!board ? (
        <Panel title="Collaborative whiteboard">
          <p className="text-sm text-muted">
            Create a board or load a template to start brainstorming.
          </p>
        </Panel>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
            {[
              ["select", "Select"],
              ["sticky", "Sticky"],
              ["rectangle", "Rect"],
              ["circle", "Circle"],
              ["arrow", "Arrow"],
              ["eraser", "Eraser"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  tool === id
                    ? "bg-sky-500/25 text-sky-200"
                    : "text-muted hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            {WHITEBOARD_ZOOM_LEVELS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  board.zoom === z ? "text-sky-300" : "text-muted"
                }`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
            <button
              type="button"
              className="text-[10px] text-muted hover:text-white"
              onClick={() => setZoom(1)}
            >
              Fit
            </button>
            <button
              type="button"
              className="ml-auto text-[10px] text-muted hover:text-white"
              onClick={() =>
                updateWhiteboard(token, board.id, {
                  gridMode: !board.gridMode,
                }).then(() =>
                  setBoard({ ...board, gridMode: !board.gridMode }),
                )
              }
            >
              Grid {board.gridMode ? "On" : "Off"}
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative h-[28rem] overflow-auto touch-pan-x touch-pan-y"
            style={{
              backgroundImage: board.gridMode
                ? "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)"
                : undefined,
              backgroundSize: board.gridMode
                ? `${20 * board.zoom}px ${20 * board.zoom}px`
                : undefined,
            }}
            onClick={handleCanvasClick}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            role="application"
            aria-label="Whiteboard canvas"
          >
            <div
              className="relative min-h-[800px] min-w-[1200px]"
              style={{
                transform: `scale(${board.zoom})`,
                transformOrigin: "0 0",
              }}
            >
              {board.objects.map((obj) => (
                <div
                  key={obj.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${obj.objectType}: ${objectLabel(obj)}`}
                  className={`absolute cursor-grab touch-none active:cursor-grabbing ${
                    selectedId === obj.id ? "ring-2 ring-sky-400" : ""
                  }`}
                  style={{
                    left: obj.positionX,
                    top: obj.positionY,
                    width: obj.width,
                    height: obj.height,
                    transform: `rotate(${obj.rotation}deg)`,
                    zIndex: obj.layer + 1,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPointerDown(e, obj);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Delete" || e.key === "Backspace") {
                      deleteWhiteboardObject(token, board.id, obj.id).then(() =>
                        loadBoard(board.id),
                      );
                    }
                  }}
                >
                  <ObjectVisual obj={obj} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom panels */}
          <div className="border-t border-white/10">
            <div className="flex flex-wrap gap-1 px-3 pt-2">
              {(
                [
                  ["objects", "Objects"],
                  ["templates", "Templates"],
                  ["layers", "Layers"],
                  ["ai", "AI Assistant"],
                  ["history", "Export"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPanel(key)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    panel === key
                      ? "bg-white/10 text-white"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="max-h-44 overflow-y-auto p-3">
              {panel === "objects" ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Shapes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {WHITEBOARD_SHAPES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => placeObject(s)}
                        className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Engineering
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {WHITEBOARD_ENGINEERING.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => placeObject(s)}
                        className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Flowchart / Circuit
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...WHITEBOARD_FLOWCHART, "resistor", "led", "motor"].map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => placeObject(s)}
                          className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted hover:text-white"
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {panel === "templates" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {WHITEBOARD_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleCreate(t.id)}
                      className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-left hover:border-sky-400/30"
                    >
                      <p className="text-sm text-white">{t.label}</p>
                      <p className="text-[10px] capitalize text-muted">
                        {t.category}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {panel === "layers" ? (
                <ul className="space-y-1 text-xs">
                  {board.objects.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-2 py-1 text-left text-muted hover:bg-white/5 hover:text-white"
                        onClick={() => setSelectedId(o.id)}
                      >
                        {o.objectType} — {objectLabel(o)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {panel === "ai" ? (
                <div className="space-y-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    placeholder="Describe your system…"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        aiWhiteboardSuggest(token, board.id, aiPrompt).then(
                          (r) => setAiSuggestions(r.suggestions),
                        )
                      }
                    >
                      Generate suggestions
                    </Button>
                    {aiSuggestions.length > 0 ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          aiWhiteboardApply(token, board.id, aiSuggestions).then(
                            () => {
                              setAiSuggestions([]);
                              loadBoard(board.id);
                            },
                          )
                        }
                      >
                        Apply as objects
                      </Button>
                    ) : null}
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-sky-400/20 bg-sky-500/5 px-3 py-2 text-xs"
                    >
                      <p className="text-white">
                        {s.label}{" "}
                        <span className="text-muted">({s.objectType})</span>
                      </p>
                      <p className="text-muted">{s.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {panel === "history" ? (
                <div className="space-y-2 text-xs text-muted">
                  <p>
                    Export: copy board JSON or screenshot from the browser for
                    documentation.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        JSON.stringify(board, null, 2),
                      );
                    }}
                  >
                    Copy board JSON
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {selected?.objectType === "sticky" ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white"
                defaultValue={objectLabel(selected)}
                onBlur={(e) =>
                  updateWhiteboardObject(token, board.id, selected.id, {
                    properties: {
                      ...(selected.properties ?? {}),
                      text: e.target.value,
                    },
                  }).then(() => loadBoard(board.id))
                }
                aria-label="Sticky note text"
              />
              <Button
                size="sm"
                onClick={() =>
                  convertStickyToTask(token, board.id, selected.id).then(() => {
                    loadBoard(board.id);
                    onTaskCreated?.();
                  })
                }
              >
                Convert to task
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
