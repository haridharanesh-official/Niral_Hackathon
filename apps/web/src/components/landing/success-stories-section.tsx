"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stories = [
  {
    name: "Ananya Rao",
    college: "NIT Innovation Campus",
    position: "Startup Founder · AeroSense Labs",
    project: "PulseGrid",
    funding: "₹45L pre-seed",
    path: [
      "Hackathon Project",
      "Funding",
      "Incubation",
      "Company Growth",
      "Current Products",
    ],
    achievements: [
      "3 municipal pilots",
      "Patent filed",
      "12-person team",
    ],
    interview:
      "Niral Hackathon forced us to ship a mesh that survived real buildings — that prototype became our seed deck.",
  },
  {
    name: "Dev Patel",
    college: "State Tech University",
    position: "ML Engineer · EdgeCraft",
    project: "MentorForge",
    funding: "Campus grant + angel",
    path: [
      "Hackathon Project",
      "Open Source",
      "Internship",
      "Full-time Role",
      "Product Line",
    ],
    achievements: ["OSS 2.4k stars", "Hired as founding eng", "Track mentor"],
    interview:
      "The judging rubric taught me to measure impact, not just model accuracy.",
  },
  {
    name: "Riya Bose",
    college: "Metro Engineering College",
    position: "Security Researcher",
    project: "Lockbyte",
    funding: "Research fellowship",
    path: [
      "Hackathon Project",
      "Lab Adoption",
      "Paper",
      "Fellowship",
      "Advisory",
    ],
    achievements: ["IEEE short paper", "Campus fleet rollout", "Talk circuit"],
    interview:
      "Showing a blocked unsigned update on stage made security tangible for judges.",
  },
];

export function SuccessStoriesSection() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(stories[0]?.name ?? "");

  return (
    <section id="success-stories" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Success Stories
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Long-term impact — from weekend prototypes to careers and companies.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {stories.map((story, index) => {
            const expanded = open === story.name;
            return (
              <motion.article
                key={story.name}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition",
                  expanded && "border-sky-400/35 bg-sky-500/[0.06]",
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-violet-500/30 font-display text-lg font-bold text-white">
                  {story.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">
                  {story.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{story.college}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sky-300">
                  {story.position}
                </p>

                <ol className="mt-5 space-y-2 border-l border-sky-400/20 pl-4">
                  {story.path.map((step) => (
                    <li key={step} className="text-sm text-muted">
                      <span className="text-sky-300">↓ </span>
                      {step}
                      {step === "Hackathon Project" ? ` · ${story.project}` : ""}
                      {step === "Funding" ? ` · ${story.funding}` : ""}
                    </li>
                  ))}
                </ol>

                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-5"
                  onClick={() => setOpen(expanded ? "" : story.name)}
                >
                  {expanded ? "Hide interview" : "Read interview"}
                  <ChevronRight
                    className={cn("h-3.5 w-3.5 transition", expanded && "rotate-90")}
                  />
                </Button>

                {expanded ? (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      “{story.interview}”
                    </p>
                    <ul className="space-y-1 text-sm text-muted">
                      {story.achievements.map((a) => (
                        <li key={a}>· {a}</li>
                      ))}
                    </ul>
                    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-sm text-muted">
                      <Play className="mr-2 h-4 w-4 text-sky-300" aria-hidden />
                      Video testimonial preview
                    </div>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
