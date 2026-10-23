"use client";

import { useState } from "react";
import { SectionState } from "@/components/common/section-state";
import { SectionSkeleton } from "@/components/common/section-skeleton";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

export function TestimonialsSection() {
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getTestimonials(),
    isEmpty: (items) => items.length === 0,
  });
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const testimonials = data ?? [];
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

      <div className="mt-10">
        <SectionState
          status={status}
          error={error}
          onRetry={reload}
          emptyMessage="Participant and mentor stories will be published live during the NIRAL 2026 event days."
          skeleton={<SectionSkeleton cards={3} />}
        >
          <div
            className="relative overflow-hidden"
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
                const key = `${item.id}-${index}`;
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
                    <p
                      className="mt-3 text-amber-300"
                      aria-label={`${item.rating} stars`}
                    >
                      {"★".repeat(item.rating)}
                      <span className="text-white/20">
                        {"★".repeat(5 - item.rating)}
                      </span>
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      “{item.quote}”
                    </p>
                  </blockquote>
                );
              })}
            </div>
          </div>
        </SectionState>
      </div>
    </section>
  );
}
