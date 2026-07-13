"use client";

import { motion, useReducedMotion } from "framer-motion";

const announcements = [
  {
    time: "2h ago",
    title: "Hardware kit requests open",
    body: "Submit kit preferences before Aug 1. Limited Jetson and Arduino pools.",
    tone: "info" as const,
  },
  {
    time: "Yesterday",
    title: "Workshop: On-device ML",
    body: "Saturday 11:00 — Edge quantization clinic with mentor office hours after.",
    tone: "success" as const,
  },
  {
    time: "3 days ago",
    title: "Registration crossing 1,400",
    body: "Team matching lobby unlocks once you verify email and pick a track.",
    tone: "warning" as const,
  },
];

const toneClass = {
  info: "border-sky-400/25 bg-sky-500/10 text-sky-200",
  success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  warning: "border-orange-400/25 bg-orange-500/10 text-orange-200",
};

export function AnnouncementsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="announcements" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Live Announcements
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Ops updates that keep the weekend moving — kits, workshops, deadlines.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
            LIVE FEED
          </span>
        </div>

        <div className="mt-10 space-y-4">
          {announcements.map((item, index) => (
            <motion.article
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:flex-row sm:items-start sm:gap-5"
            >
              <span
                className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${toneClass[item.tone]}`}
              >
                {item.time}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
