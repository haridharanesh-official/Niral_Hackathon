"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DailyChallengeSection() {
  const reduceMotion = useReducedMotion();
  const [remaining, setRemaining] = useState("--:--:--");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const deadline = Date.now() + 8 * 3600_000 + 45 * 60_000 + 23_000;
    const tick = () => {
      const diff = Math.max(0, deadline - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="daily-challenge" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glow-ring rounded-3xl border border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10 p-6 sm:p-8"
        >
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-sky-300">
            Today&apos;s Challenge
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">
            Build an MQTT Publisher
          </h2>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Difficulty
              </dt>
              <dd className="mt-1 text-sky-200">Medium</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Reward
              </dt>
              <dd className="mt-1 font-mono text-emerald-300">+150 XP</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Time Remaining
              </dt>
              <dd className="mt-1 font-mono tabular-nums text-white">{remaining}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {done ? (
              <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Badge unlocked · Leaderboard updated
              </p>
            ) : (
              <>
                <Link href="/games/daily">
                  <Button className="cta-primary" size="lg">
                    Start Challenge
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setDone(true)}
                >
                  Mark complete (demo)
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
