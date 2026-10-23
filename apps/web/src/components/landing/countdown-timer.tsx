"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Official NIRAL 2026 Hackathon Start (Asia/Kolkata timezone)
const DEFAULT_EVENT_START = new Date("2026-12-03T00:00:00+05:30").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type CountdownTimerProps = {
  className?: string;
  onLiveChange?: (isLive: boolean) => void;
  /** Server-synced event start (ms since epoch). */
  targetMs?: number;
  hasExactTimes?: boolean;
};

export function CountdownTimer({
  className,
  onLiveChange,
  targetMs,
  hasExactTimes = false,
}: CountdownTimerProps) {
  const [now, setNow] = useState<number | null>(null);
  const eventStart = targetMs ?? DEFAULT_EVENT_START;

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ready = now !== null;
  const diff = ready ? Math.max(0, eventStart - now) : 0;
  const isLive = ready && diff === 0;

  useEffect(() => {
    if (!ready) return;
    onLiveChange?.(isLive);
  }, [isLive, onLiveChange, ready]);

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  if (!ready) {
    return (
      <div
        className={cn("mt-8 grid max-w-lg grid-cols-4 gap-3", className)}
        aria-hidden
      >
        {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-sky-400/20 bg-black/30 px-3 py-4 text-center backdrop-blur-md"
          >
            <div className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
              --
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300/80">
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isLive) {
    return (
      <div
        className={cn(
          "mt-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-display text-sm font-semibold tracking-[0.2em] text-emerald-300">
          NIRAL 2026 LIVE
        </span>
      </div>
    );
  }

  return (
    <div className={cn("mt-8 max-w-xl", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-sky-200">
          <Calendar className="h-3.5 w-3.5 text-sky-400" />
          December 3–4, 2026 · Asia/Kolkata
        </span>
        {!hasExactTimes ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Clock className="h-3 w-3 text-muted" /> Exact start time to be announced
          </span>
        ) : null}
      </div>

      <div
        className="grid grid-cols-4 gap-3"
        role="timer"
        aria-live="off"
        aria-label={`Countdown: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
      >
        {[
          ["Days", days],
          ["Hours", hours],
          ["Minutes", minutes],
          ["Seconds", seconds],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-sky-400/20 bg-black/40 px-3 py-4 text-center backdrop-blur-md"
          >
            <div className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
              {pad(Number(value))}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300/80">
              {String(label)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_EVENT_START as EVENT_START };
