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
  const appName = content?.event?.name || "Niral Hackathon";
  const initial = appName.charAt(0) || "H";

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-base font-bold text-white shadow-sm">
          {initial}
        </div>
        <p className="font-sans text-2xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
          {appName}
        </p>
        <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
          IoT & Innovation Challenge
        </span>
      </motion.div>
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 max-w-3xl font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-[var(--foreground)]"
      >
        {isLive ? "Hackathon Live" : (content?.event?.tagline || title)}
      </motion.h1>
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
      {content?.event?.venue ? `Venue: ${content.event.venue}` : "Build, iterate, and ship connected hardware & AI projects in a refined collaborative ecosystem."}
    </motion.p>
  );
}
