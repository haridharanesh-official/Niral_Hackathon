"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import type { HomeStatistics } from "@/types/home";

export function StatisticsCards({ stats }: { stats: HomeStatistics | null }) {
  const reduceMotion = useReducedMotion();

  const items = [
    { label: "Participants", value: stats?.participants ?? 0 },
    { label: "Teams", value: stats?.teams ?? 0 },
    {
      label: "Prize Pool",
      value: stats?.prizePool ?? 0,
      format: (n: number) => `₹${n.toLocaleString("en-IN")}`,
    },
    { label: "Mentors", value: stats?.mentors ?? 0 },
    { label: "Judges", value: stats?.judges ?? 0 },
    { label: "Sponsors", value: stats?.sponsors ?? 0 },
    { label: "Countries", value: stats?.countries ?? 0 },
  ] as const;

  return (
    <motion.dl
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7"
    >
      {items.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-3.5 py-3 text-center shadow-sm transition hover:border-stone-400"
        >
          <dt className="text-xs font-medium text-[var(--muted)]">
            {stat.label}
          </dt>
          <dd className="mt-1 font-sans text-lg sm:text-xl font-bold tabular-nums text-[var(--foreground)]">
            <AnimatedCounter
              value={stat.value}
              format={"format" in stat ? stat.format : undefined}
            />
          </dd>
        </div>
      ))}
    </motion.dl>
  );
}
