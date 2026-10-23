"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, Radio, Trophy, Users } from "lucide-react";

const EVENT_START = new Date("2026-08-15T09:00:00Z").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning, Innovator!";
  if (hour < 17) return "Good Afternoon!";
  return "Welcome Back!";
}

export function LoginWelcomePanel() {
  const [now, setNow] = useState<number | null>(null);
  const title = useMemo(() => greeting(), []);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = now ? Math.max(0, EVENT_START - now) : 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  const stats = [
    { icon: Users, label: "Participants", value: "2,500+" },
    { icon: Trophy, label: "Prize Pool", value: "₹5L+" },
    { icon: Cpu, label: "Themes", value: "6" },
    { icon: Radio, label: "Live Tracks", value: "IoT + AI" },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-[#0a1228] to-violet-500/20 p-8">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative z-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-300">
          HackOS IoT Innovation Hackathon
        </p>
        <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Sign in to continue building, mentoring, judging, or running the
          weekend — your role dashboard is one step away.
        </p>
      </div>

      <div className="relative z-10 mt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-200">
          Event countdown
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ["Days", days],
            ["Hours", hours],
            ["Mins", mins],
            ["Secs", secs],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center backdrop-blur"
            >
              <div className="font-mono text-xl font-bold tabular-nums text-white">
                {now === null ? "--" : pad(value as number)}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-sky-300/80">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/8 bg-white/[0.04] p-3"
          >
            <stat.icon className="h-4 w-4 text-cyan-300" aria-hidden />
            <p className="mt-2 font-mono text-sm font-semibold text-white">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
