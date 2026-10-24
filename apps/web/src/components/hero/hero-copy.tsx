"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useAppContent } from "@/store/content-context";

export function HeroTitle({
  title,
  isLive,
}: {
  title: string;
  isLive?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const appName = "NIRAL Hackathon 2026";

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-base font-bold text-white shadow-sm">
          N
        </div>
        <p className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {appName}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          IoT & Innovation Hackathon
        </span>
      </motion.div>

      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 max-w-3xl font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-[var(--foreground)]"
      >
        {isLive
          ? "Hackathon Live — Prototype Sprint in Progress"
          : (content?.event?.tagline || title || "The Future of Connected Hardware & Edge Intelligence")}
      </motion.h1>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[var(--muted)]"
      >
        <span className="inline-flex items-center rounded-lg bg-[var(--card)] border border-[var(--card-border)] px-2.5 py-1 text-[var(--foreground)]">
          📅 December 3–4, 2026
        </span>
        <span className="inline-flex items-center rounded-lg bg-[var(--card)] border border-[var(--card-border)] px-2.5 py-1 text-[var(--foreground)]">
          📍 Sri Shakthi Institute of Engineering and Technology
        </span>
      </motion.div>
    </>
  );
}

export function HeroSubtitle() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();

  return (
    <motion.p
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-4 font-sans text-base sm:text-lg text-[var(--muted)] max-w-2xl leading-relaxed"
    >
      {content?.event?.description ||
        "Join India's premier 36-hour IoT and embedded innovation hackathon. Build tangible hardware, deploy intelligent edge models, and collaborate with top student and industry engineers."}
    </motion.p>
  );
}
