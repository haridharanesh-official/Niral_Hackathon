"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const options = [
  "Arduino",
  "ESP32",
  "Raspberry Pi",
  "STM32",
  "LoRaWAN",
] as const;

type Option = (typeof options)[number];

export function LivePollsSection() {
  const reduceMotion = useReducedMotion();
  const [votes, setVotes] = useState<Record<Option, number>>({
    Arduino: 42,
    ESP32: 67,
    "Raspberry Pi": 58,
    STM32: 31,
    LoRaWAN: 24,
  });
  const [picked, setPicked] = useState<Option | null>(null);

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVotes((prev) => {
        const key = options[Math.floor(Math.random() * options.length)];
        if (!key) return prev;
        return { ...prev, [key]: prev[key] + 1 };
      });
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="polls" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-6 sm:p-8"
        >
          <h2 className="font-display text-3xl font-bold text-white">
            Live Polls
          </h2>
          <p className="mt-3 text-muted">
            Which technology interests you most?
          </p>

          <div className="mt-8 space-y-3">
            {options.map((opt) => {
              const pct = total ? Math.round((votes[opt] / total) * 100) : 0;
              const selected = picked === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    "relative w-full overflow-hidden rounded-2xl border border-white/10 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    selected && "border-sky-400/40",
                  )}
                  onClick={() => {
                    if (picked) return;
                    setPicked(opt);
                    setVotes((v) => ({ ...v, [opt]: v[opt] + 1 }));
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-sky-500/20 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <span className="relative z-10 flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{opt}</span>
                    <span className="font-mono tabular-nums text-sky-200">
                      {pct}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[11px] text-muted">
            {total.toLocaleString("en-IN")} votes · updates instantly
          </p>
        </motion.div>
      </div>
    </section>
  );
}
