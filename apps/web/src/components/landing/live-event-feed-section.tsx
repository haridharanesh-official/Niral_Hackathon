"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const seed = [
  { time: "09:10", title: "Registration Open" },
  { time: "09:45", title: "Workshop Started" },
  { time: "10:15", title: "Hardware Counter Open" },
  { time: "11:00", title: "Quiz Released" },
  { time: "12:20", title: "Mentor Session Started" },
  { time: "13:00", title: "Lunch" },
  { time: "15:00", title: "Checkpoint Review" },
];

const extras = [
  { time: "15:40", title: "New announcement posted" },
  { time: "16:05", title: "Sponsor booth opened" },
  { time: "16:30", title: "Daily challenge refreshed" },
];

export function LiveEventFeedSection() {
  const reduceMotion = useReducedMotion();
  const [events, setEvents] = useState(seed);

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      const next = extras[i % extras.length];
      if (!next) return;
      i += 1;
      setEvents((prev) => {
        if (prev.some((e) => e.title === next.title && e.time === next.time)) {
          return prev;
        }
        return [...prev, next];
      });
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="live-feed" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Live Event Feed
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Real-time ops updates via simulated WebSocket polling.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
            WS · LIVE
          </span>
        </div>

        <ol className="relative mt-10 space-y-5 border-l border-sky-400/20 pl-8">
          {events.map((event, index) => (
            <motion.li
              key={`${event.time}-${event.title}`}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="relative"
            >
              <span className="absolute -left-[2.4rem] top-1.5 h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.8)]" />
              <p className="font-mono text-xs text-violet-200">{event.time}</p>
              <p className="mt-1 font-display text-lg text-white">{event.title}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
