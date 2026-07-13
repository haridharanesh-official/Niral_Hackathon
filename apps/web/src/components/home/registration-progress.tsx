"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionState } from "@/components/common/section-state";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

export function RegistrationProgressSection() {
  const reduceMotion = useReducedMotion();
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getRegistration(),
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!data) return;
    if (reduceMotion) {
      setProgress(data.percent);
      return;
    }
    const id = window.requestAnimationFrame(() => setProgress(data.percent));
    return () => window.cancelAnimationFrame(id);
  }, [data, reduceMotion]);

  return (
    <section id="registration-progress" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <SectionState status={status} error={error} onRetry={reload}>
          {data ? (
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
                    {data.status === "closed"
                      ? "Registration Closed"
                      : `${data.filled.toLocaleString("en-IN")} / ${data.capacity.toLocaleString("en-IN")} Seats Filled`}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-mono text-3xl font-bold tabular-nums",
                    data.status !== "open" ? "text-orange-300" : "text-sky-300",
                  )}
                >
                  {data.percent}%
                </p>
              </div>

              <div
                className="mt-6 h-4 overflow-hidden rounded-full bg-white/5"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={data.percent}
                aria-label="Registration seats filled"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none",
                    data.status !== "open"
                      ? "bg-gradient-to-r from-orange-500 to-amber-400"
                      : "bg-gradient-to-r from-sky-500 to-violet-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          ) : null}
        </SectionState>
      </div>
    </section>
  );
}
