"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionState } from "@/components/common/section-state";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

const tabs = [
  "Overall",
  "Quiz",
  "Games",
  "Innovation",
  "Colleges",
  "Departments",
] as const;

function ConfettiBurst() {
  const bits = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${10 + ((i * 17) % 80)}%`,
        delay: `${(i % 6) * 0.05}s`,
        color: ["#38bdf8", "#a78bfa", "#34d399", "#fb923c"][i % 4],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-2 h-2 w-2 animate-confetti rounded-sm"
          style={{ left: b.left, animationDelay: b.delay, background: b.color }}
        />
      ))}
    </div>
  );
}

export function LeaderboardTeaser() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overall");
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getLeaderboard(tab.toLowerCase()),
    isEmpty: (items) => items.length === 0,
    deps: [tab],
  });
  const [rows, setRows] = useState(data ?? []);
  const [firstPlace, setFirstPlace] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (data) {
      setRows(data);
      setFirstPlace(data[0]?.name ?? "");
    }
  }, [data]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) => {
        if (!prev.length) return prev;
        const next = prev.map((row, i) => ({
          ...row,
          xp: row.xp + (i === 0 ? 2 : Math.random() > 0.6 ? 3 : 1),
        }));
        next.sort((a, b) => b.xp - a.xp);
        const leader = next[0]?.name ?? "";
        if (leader && leader !== firstPlace) {
          setFirstPlace(leader);
          setShowConfetti(true);
          window.setTimeout(() => setShowConfetti(false), 1800);
        }
        return next.map((row, index) => ({ ...row, rank: index + 1 }));
      });
    }, 2800);
    return () => window.clearInterval(id);
  }, [firstPlace]);

  return (
    <section id="leaderboard" className="relative scroll-mt-24 py-20">
      {showConfetti ? <ConfettiBurst /> : null}
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Today&apos;s Leaderboard
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Scores tick live — watch ranks shuffle as XP lands.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
            LIVE XP
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard categories">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                tab === t
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
                  : "border-white/10 text-muted hover:border-white/20 hover:text-foreground",
              )}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <SectionState status={status} error={error} onRetry={reload} emptyMessage="No rankings yet.">
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <AnimatePresence mode="popLayout">
                {rows.map((row) => (
                  <motion.div
                    key={`${tab}-${row.name}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2 border-b border-white/5 px-4 py-4 text-sm last:border-0 sm:grid-cols-[4rem_1fr_6rem]"
                  >
                    <span className="font-display text-sky-300">#{row.rank}</span>
                    <span className="font-medium text-white">{row.name}</span>
                    <span className="text-right font-mono tabular-nums text-violet-200">
                      {row.xp.toLocaleString("en-IN")} XP
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SectionState>
        </div>
      </div>
    </section>
  );
}
