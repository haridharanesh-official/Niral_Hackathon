"use client";

import { motion, useReducedMotion } from "framer-motion";
import { APP_NAME } from "@hackos/shared";

export function HeroTitle({
  title,
  isLive,
}: {
  title: string;
  isLive?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="glow-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 font-display text-lg font-bold text-white">
          H
        </div>
        <p className="font-display text-3xl font-bold tracking-[0.28em] text-sky-300 sm:text-5xl">
          {APP_NAME}
        </p>
      </motion.div>
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 max-w-3xl font-display text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl"
      >
        {isLive ? "Hackathon Live" : title}
      </motion.h1>
    </>
  );
}

export function HeroSubtitle() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.p
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-4 font-display text-lg tracking-[0.18em] text-cyan-200/90 sm:text-xl"
    >
      Build. Innovate. Compete.
    </motion.p>
  );
}
