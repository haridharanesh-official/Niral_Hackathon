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
      className="relative z-30 border-b border-[var(--card-border)] bg-[var(--sand-50)]"
      role="region"
      aria-label="Live announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#FDBA74] bg-[#FBF0EB] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
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
              <div className="h-4 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
            }
          >
            {messages.length ? (
              <div
                className={cn(
                  "flex w-max gap-10 whitespace-nowrap text-xs text-[var(--foreground)]",
                  paused
                    ? "[animation-play-state:paused]"
                    : "animate-marquee motion-reduce:animate-none",
                )}
              >
                {loop.map((item, index) => (
                  <span
                    key={`${item.text}-${index}`}
                    className={cn(item.priority && "font-semibold text-[var(--primary)]")}
                  >
                    {item.priority ? "★ " : ""}
                    {item.text}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[var(--muted)]">
                No announcements available.
              </span>
            )}
          </SectionState>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-full p-1 text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]"
          aria-label="Dismiss announcement banner"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
