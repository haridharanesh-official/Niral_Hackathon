"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_EVENT_START = new Date("2026-08-15T09:00:00Z").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type CountdownTimerProps = {
  className?: string;
  onLiveChange?: (isLive: boolean) => void;
  /** Server-synced event start (ms since epoch). */
  targetMs?: number;
};

export function CountdownTimer({
  className,
  onLiveChange,
  targetMs,
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

  const units = [
    ["Days", days],
    ["Hours", hours],
    ["Minutes", minutes],
    ["Seconds", seconds],
  ] as const;

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
          HACKATHON LIVE
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("mt-8 grid max-w-lg grid-cols-4 gap-3", className)}
      role="timer"
      aria-live="off"
      aria-label={`Countdown: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
    >
      {units.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-sky-400/20 bg-black/30 px-3 py-4 text-center backdrop-blur-md"
        >
          <div className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
            {pad(value)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300/80">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export { DEFAULT_EVENT_START as EVENT_START };

