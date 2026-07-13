"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Ananya Rao",
    role: "Team Lead",
    college: "NIT Innovation Campus",
    rating: 5,
    quote:
      "The mentorship completely changed how we approached product development.",
    initials: "AR",
  },
  {
    name: "Dev Patel",
    role: "Participant",
    college: "State Tech University",
    rating: 5,
    quote:
      "Live leaderboard pressure made us ship a working mesh before finals.",
    initials: "DP",
  },
  {
    name: "Priya Nair",
    role: "Sponsor Liaison",
    college: "Industry Partner",
    rating: 5,
    quote:
      "Judging scorecards were transparent — sponsors got audience data that mattered.",
    initials: "PN",
  },
  {
    name: "Kabir Sen",
    role: "Hardware Lead",
    college: "Metro Engineering",
    rating: 4,
    quote:
      "Kit desks and MQTT workshops felt like a real innovation lab, not a pitch theater.",
    initials: "KS",
  },
  {
    name: "Sara Khan",
    role: "Mentor",
    college: "IoT Lab",
    rating: 5,
    quote:
      "Checkpoint reviews gave teams architecture feedback they could apply the same night.",
    initials: "SK",
  },
];

export function TestimonialsSection() {
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const loop = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Testimonials
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Social proof from builders, mentors, and partners — hover to pause.
        </p>
      </div>

      <div
        className="relative mt-10 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setExpanded(null);
        }}
      >
        <div
          className={cn(
            "flex w-max gap-4 px-6",
            paused
              ? "[animation-play-state:paused]"
              : "animate-marquee-slow motion-reduce:animate-none",
          )}
        >
          {loop.map((item, index) => {
            const key = `${item.name}-${index}`;
            const isOpen = expanded === key;
            return (
              <blockquote
                key={key}
                className={cn(
                  "w-80 shrink-0 rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition",
                  isOpen &&
                    "border-sky-400/40 bg-sky-500/[0.08] shadow-[0_0_28px_rgba(56,189,248,0.18)]",
                )}
                onMouseEnter={() => setExpanded(key)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/40 to-violet-500/40 font-display text-sm font-bold text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-white">
                      {item.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {item.role} · {item.college}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-amber-300" aria-label={`${item.rating} stars`}>
                  {"★".repeat(item.rating)}
                  <span className="text-white/20">
                    {"★".repeat(5 - item.rating)}
                  </span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                  “{item.quote}”
                </p>
                {isOpen ? (
                  <div className="mt-4 flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-xs text-muted">
                    Video testimonial · muted hover preview
                  </div>
                ) : null}
              </blockquote>
            );
          })}
        </div>
      </div>
    </section>
  );
}
