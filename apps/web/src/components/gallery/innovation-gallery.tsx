"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Download, Heart, Share2, X } from "lucide-react";
import { SectionState } from "@/components/common/section-state";
import { SectionSkeleton } from "@/components/common/section-skeleton";
import { useAsyncSection } from "@/hooks/use-async-section";
import { trackAnalytics } from "@/hooks/use-analytics";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

export function GallerySection() {
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getGallery(),
    isEmpty: (items) => items.length === 0,
  });
  const [theme, setTheme] = useState("All");
  const [type, setType] = useState("All");
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const items = data ?? [];
  const themes = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.theme)))],
    [items],
  );
  const types = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.type)))],
    [items],
  );

  const filtered = items.filter(
    (i) =>
      (theme === "All" || i.theme === theme) &&
      (type === "All" || i.type === type),
  );

  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight")
        setViewer((v) => (v === null ? v : (v + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setViewer((v) =>
          v === null ? v : (v - 1 + filtered.length) % filtered.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, filtered.length]);

  const active = viewer !== null ? filtered[viewer] : null;

  return (
    <section id="gallery" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Innovation Gallery
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Photos, circuits, CAD, papers — filter and open fullscreen.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted">
            Theme
            <select
              className="field-input mt-1"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {themes.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Type
            <select
              className="field-input mt-1"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {types.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-10">
          <SectionState
            status={status}
            error={error}
            onRetry={reload}
            emptyMessage="No gallery items available."
            skeleton={<SectionSkeleton cards={6} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((shot, index) => (
                <button
                  key={shot.id}
                  type="button"
                  className={`group relative flex h-44 items-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${shot.tone} p-5 text-left transition hover:border-sky-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
                  onClick={() => {
                    setViewer(index);
                    trackAnalytics("gallery_opened", { id: shot.id });
                  }}
                >
                  <span className="relative z-10 font-display text-lg font-semibold text-white">
                    {shot.title}
                  </span>
                </button>
              ))}
            </div>
          </SectionState>
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setViewer(null)}
        >
          <div
            className="glass w-full max-w-3xl rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {active.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{active.caption}</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-white/5"
                aria-label="Close viewer"
                onClick={() => setViewer(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={cn("mt-4 h-64 rounded-2xl bg-gradient-to-br sm:h-80", active.tone)} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200"
                onClick={() =>
                  setLiked((s) => ({ ...s, [active.id]: !s[active.id] }))
                }
              >
                <Heart className="h-4 w-4" />
                {liked[active.id] ? "Liked" : "Like"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200"
              >
                <Bookmark className="h-4 w-4" /> Bookmark
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
