"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CircuitBoard,
  Crosshair,
  DoorOpen,
  Gamepad2,
  Grid3X3,
  Puzzle,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const games = [
  {
    title: "Circuit Builder",
    href: "/games/circuit-builder",
    icon: CircuitBoard,
    difficulty: "Medium",
    reward: "+80 XP",
    blurb: "Wire logic paths against the clock.",
  },
  {
    title: "Guess Sensor",
    href: "/games/guess-sensor",
    icon: Crosshair,
    difficulty: "Easy",
    reward: "+40 XP",
    blurb: "Identify sensors from signal clues.",
  },
  {
    title: "Escape Room",
    href: "/games/escape-room",
    icon: DoorOpen,
    difficulty: "Hard",
    reward: "+120 XP",
    blurb: "Solve IoT puzzles to unlock the lab.",
  },
  {
    title: "Memory Game",
    href: "/games/memory",
    icon: Grid3X3,
    difficulty: "Easy",
    reward: "+35 XP",
    blurb: "Match modules and pinouts fast.",
  },
  {
    title: "Crossword",
    href: "/games/crossword",
    icon: Puzzle,
    difficulty: "Medium",
    reward: "+60 XP",
    blurb: "Fill embedded and cloud jargon.",
  },
  {
    title: "Hardware Hunt",
    href: "/games/hardware-hunt",
    icon: Search,
    difficulty: "Medium",
    reward: "+70 XP",
    blurb: "Track components across the venue map.",
  },
  {
    title: "Spin Wheel",
    href: "/games/spin-wheel",
    icon: Sparkles,
    difficulty: "Easy",
    reward: "+25 XP",
    blurb: "Daily loot for kits and XP boosts.",
  },
  {
    title: "Debug Challenge",
    href: "/games/debug",
    icon: Wrench,
    difficulty: "Hard",
    reward: "+100 XP",
    blurb: "Find the firmware fault before timeout.",
  },
];

export function MiniGamesSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="games" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Mini Games Preview
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Warm up skills before kickoff — hover for rewards, click for details.
            </p>
          </div>
          <Link href="/games">
            <Button variant="secondary">
              <Gamepad2 className="h-4 w-4" />
              Open arena
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, index) => {
            const open = active === game.title;
            return (
              <motion.article
                key={game.title}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "game-card group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:rotate-1 hover:border-sky-400/40 hover:shadow-[0_0_28px_rgba(56,189,248,0.25)] motion-reduce:transform-none",
                  open && "border-sky-400/50",
                )}
                onClick={() => setActive(open ? null : game.title)}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-sky-300 animate-ping motion-reduce:animate-none" />
                  <span className="absolute bottom-6 left-8 h-1.5 w-1.5 rounded-full bg-violet-300 animate-pulse-glow" />
                </div>
                <game.icon className="h-6 w-6 text-cyan-300" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold text-white">
                  {game.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{game.blurb}</p>
                {open ? (
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                    <p className="text-sky-200">Difficulty · {game.difficulty}</p>
                    <p className="font-mono text-emerald-300">Reward · {game.reward}</p>
                    <Link href={game.href} className="inline-flex" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button size="sm" className="cta-primary mt-1">
                        Play preview
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-sky-300/70">
                    Click for details
                  </p>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
