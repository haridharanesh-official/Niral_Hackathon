"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const CAPACITY = 1000;
const FILLED = 720;

export function RegistrationProgressSection() {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const percent = Math.min(100, Math.round((FILLED / CAPACITY) * 100));
  const closed = percent >= 100;
  const nearlyFull = percent > 90 && !closed;

  useEffect(() => {
    if (reduceMotion) {
      setProgress(percent);
      return;
    }
    const id = window.requestAnimationFrame(() => setProgress(percent));
    return () => window.cancelAnimationFrame(id);
  }, [percent, reduceMotion]);

  return (
    <section id="registration-progress" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Registration Progress
              </h2>
              <p className="mt-2 text-sm text-muted">
                {closed
                  ? "Registration Closed"
                  : `${FILLED.toLocaleString("en-IN")} / ${CAPACITY.toLocaleString("en-IN")} Seats Filled`}
              </p>
            </div>
            <p
              className={cn(
                "font-mono text-3xl font-bold tabular-nums",
                nearlyFull || closed ? "text-orange-300" : "text-sky-300",
              )}
            >
              {closed ? "100%" : `${percent}%`}
            </p>
          </div>

          <div
            className="mt-6 h-4 overflow-hidden rounded-full bg-white/5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Registration seats filled"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none",
                closed || nearlyFull
                  ? "bg-gradient-to-r from-orange-500 to-amber-400"
                  : "bg-gradient-to-r from-sky-500 to-violet-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {closed ? (
            <p className="mt-4 font-display text-sm tracking-[0.18em] text-orange-300">
              REGISTRATION CLOSED
            </p>
          ) : nearlyFull ? (
            <p className="mt-4 text-sm text-orange-200">
              Seats nearly full — register soon to secure your spot.
            </p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
