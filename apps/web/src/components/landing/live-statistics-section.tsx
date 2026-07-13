"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type LiveMetric = {
  key: string;
  label: string;
  base: number;
  variance: number;
};

const metrics: LiveMetric[] = [
  { key: "online", label: "Currently Online", base: 312, variance: 24 },
  { key: "teams", label: "Live Teams", base: 148, variance: 8 },
  { key: "projects", label: "Projects Started", base: 96, variance: 6 },
  { key: "sessions", label: "Mentor Sessions", base: 41, variance: 4 },
  { key: "questions", label: "Questions Answered", base: 287, variance: 12 },
  { key: "components", label: "Components Issued", base: 620, variance: 18 },
  { key: "announcements", label: "Announcements Today", base: 7, variance: 1 },
  { key: "volunteers", label: "Active Volunteers", base: 28, variance: 3 },
];

function jitter(base: number, variance: number) {
  const delta = Math.round((Math.random() * 2 - 1) * variance);
  return Math.max(0, base + delta);
}

export function LiveStatisticsSection() {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(metrics.map((m) => [m.key, m.base])),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setValues(
        Object.fromEntries(
          metrics.map((m) => [m.key, jitter(m.base, m.variance)]),
        ),
      );
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="live-stats" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Interactive Live Statistics
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Event metrics refresh every few seconds — excitement you can measure.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
            POLLING · LIVE
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.key}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="glass rounded-2xl p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {metric.label}
              </p>
              <p
                className="mt-3 font-mono text-3xl font-bold tabular-nums text-white"
                aria-live="polite"
              >
                {(values[metric.key] ?? metric.base).toLocaleString("en-IN")}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
