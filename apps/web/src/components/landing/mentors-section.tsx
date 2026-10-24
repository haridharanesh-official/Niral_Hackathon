"use client";

import { motion, useReducedMotion } from "framer-motion";
import { UserCheck, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MentorsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="mentors" className="scroll-mt-24 py-16" aria-label="Mentors and Judges">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Evaluation & Guidance
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Mentors & Judges
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Our judging panel consists of accomplished embedded systems architects, IoT specialists, and academic researchers.
            </p>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-8 sm:p-12 text-center shadow-sm relative overflow-hidden"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)] mb-5">
            <UserCheck className="h-8 w-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Coming Soon
          </span>

          <h3 className="font-sans text-xl sm:text-2xl font-bold text-[var(--foreground)] max-w-xl mx-auto">
            Jury Panel & Industry Mentors Coming Soon
          </h3>

          <p className="mt-3 text-sm text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            The official jury panel, industry mentors, and domain specialists from leading semiconductor, cloud, and IoT enterprises will be unveiled ahead of the hackathon kickoff.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:iotclub.siet@gmail.com?subject=NIRAL%202026%20Mentor%20Inquiry">
              <Button size="md" className="cta-primary">
                <Mail className="mr-2 h-4 w-4" /> Apply as Mentor / Judge
              </Button>
            </a>
            <a href="#contact">
              <Button size="md" variant="secondary">
                Contact Organizing Team
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
