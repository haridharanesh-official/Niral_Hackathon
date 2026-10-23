"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { useAppContent } from "@/store/content-context";

export function AboutSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const event = content?.event;
  const s = content?.statistics;

  const aboutStats = [
    {
      label: "Participants",
      render: (n: number) => `${n.toLocaleString("en-IN")}+`,
      value: s?.participants ?? 2500,
    },
    {
      label: "Teams",
      render: (n: number) => `${n}+`,
      value: s?.teams ?? 600,
    },
    {
      label: "Mentors",
      render: (n: number) => `${n}+`,
      value: s?.mentors ?? 42,
    },
    {
      label: "Industry Partners",
      render: (n: number) => `${n}+`,
      value: s?.sponsors ?? 15,
    },
    {
      label: "Innovation",
      render: (n: number) => `${n} Hours`,
      value: 72,
    },
    {
      label: "Prize Pool",
      render: (n: number) => `₹${n.toLocaleString("en-IN")}+`,
      value: event?.prizePool ?? 500000,
    },
  ];

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-16">
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
          About {event?.name || "Niral Hackathon"}
        </p>

        <div className="mt-4 grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
              {event?.tagline || "The Future of Connected Hardware Starts Here"}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {event?.description ||
                "A research-driven hackathon platform bringing together innovators, engineers, researchers, and students to build tangible solutions."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#themes">
                <Button size="md" className="cta-primary">
                  Explore themes <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <a href="#prizes">
                <Button size="md" variant="secondary">
                  View rewards
                </Button>
              </a>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {aboutStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-4 text-center shadow-sm transition hover:border-stone-400"
              >
                <div className="font-sans text-xl sm:text-2xl font-bold tabular-nums text-[var(--foreground)]">
                  <AnimatedCounter value={stat.value} format={stat.render} />
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
