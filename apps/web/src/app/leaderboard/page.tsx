"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Entry = {
  rank: number;
  name: string;
  score: number;
  xp?: number;
  meta?: string;
  college?: string | null;
  department?: string | null;
};

const tabs = [
  "overall",
  "quiz",
  "team",
  "innovation",
  "game",
  "college",
  "department",
] as const;

export default function LeaderboardPage() {
  const [type, setType] = useState<(typeof tabs)[number]>("overall");
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`${apiUrl}/api/leaderboard?type=${type}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("offline");
        return res.json();
      })
      .then(setRows)
      .catch(() => {
        setError("Live API offline — showing preview data.");
        setRows([
          { rank: 1, name: "Neon Flux", score: 9840 },
          { rank: 2, name: "Circuit Wolves", score: 9610 },
          { rank: 3, name: "Packet Ghosts", score: 9425 },
          { rank: 4, name: "Latency Zero", score: 9180 },
          { rank: 5, name: "Quantum Nest", score: 9012 },
        ]);
      });
  }, [type]);

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
              Live Leaderboard
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              Rankings
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={type === tab ? "primary" : "secondary"}
              onClick={() => setType(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-[4rem_1fr_6rem] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            <span>Rank</span>
            <span>Name</span>
            <span className="text-right">Score</span>
          </div>
          {rows.map((row) => (
            <div
              key={`${row.rank}-${row.name}`}
              className="grid grid-cols-[4rem_1fr_6rem] gap-2 border-b border-white/5 px-4 py-4 text-sm last:border-0"
            >
              <span className="font-display text-sky-300">#{row.rank}</span>
              <div>
                <p className="text-white">{row.name}</p>
                {(row.meta || row.college || row.department) && (
                  <p className="text-xs text-muted">
                    {row.meta || [row.college, row.department].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-right font-mono text-violet-200">
                {row.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <section className="glass mt-8 rounded-3xl p-6">
          <h2 className="font-display text-xl text-white">Live Scorecard Rubric</h2>
          <p className="mt-2 text-sm text-muted">
            Innovation · Technical · Presentation · Scalability · Impact · UI · Business
            Value — with judge comments streamed during finals.
          </p>
        </section>
      </div>
    </div>
  );
}
