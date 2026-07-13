"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionState } from "@/components/common/section-state";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getAnnouncements(),
    isEmpty: (items) => items.length === 0,
  });

  if (dismissed) return null;

  const messages = (data ?? []).map((item) => ({
    text: item.title,
    priority: item.priority !== "normal",
  }));
  const loop = [...messages, ...messages];

  return (
    <div
      className="relative z-30 border-b border-sky-400/20 bg-sky-500/10"
      role="region"
      aria-label="Live announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sky-200">
          <Megaphone className="h-3 w-3" aria-hidden />
          Live
        </span>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <SectionState
            status={status === "loading" ? "success" : status}
            error={error}
            onRetry={reload}
            emptyMessage="No announcements available."
            skeleton={
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            }
          >
            {messages.length ? (
              <div
                className={cn(
                  "flex w-max gap-10 whitespace-nowrap font-mono text-xs text-sky-100/90 sm:text-sm",
                  paused
                    ? "[animation-play-state:paused]"
                    : "animate-marquee motion-reduce:animate-none",
                )}
              >
                {loop.map((item, index) => (
                  <span
                    key={`${item.text}-${index}`}
                    className={cn(item.priority && "font-semibold text-white")}
                  >
                    {item.priority ? "★ " : ""}
                    {item.text}
                  </span>
                ))}
              </div>
            ) : (
              <span className="font-mono text-xs text-muted">
                No announcements available.
              </span>
            )}
          </SectionState>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-sky-200/80 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label="Dismiss announcement banner"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
