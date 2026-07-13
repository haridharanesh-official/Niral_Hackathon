"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "@/components/landing/animated-counter";

const stats = [
  { value: 1450, label: "Participants" },
  { value: 326, label: "Teams" },
  {
    value: 300000,
    label: "Prize Pool",
    format: (n: number) => `₹${n.toLocaleString("en-IN")}`,
  },
  { value: 42, label: "Mentors" },
  { value: 18, label: "Judges" },
  { value: 15, label: "Sponsors" },
  { value: 5, label: "Countries" },
] as const;

export function StatsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="stats"
      className="scroll-mt-24 border-y border-white/5 bg-sky-500/[0.03] py-14"
      aria-label="Event statistics"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 sm:grid-cols-3 lg:grid-cols-7">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="text-center"
          >
            <div className="font-mono text-2xl font-bold tabular-nums text-white md:text-3xl">
              <AnimatedCounter
                value={stat.value}
                format={"format" in stat ? stat.format : undefined}
              />
            </div>
            <div className="mt-1 text-sm text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
