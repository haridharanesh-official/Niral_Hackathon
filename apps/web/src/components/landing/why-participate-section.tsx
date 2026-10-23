"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Banknote,
  Briefcase,
  Network,
  Rocket,
  UserRound,
} from "lucide-react";
import { useAppContent } from "@/store/content-context";

const iconList = [Rocket, UserRound, Network, Briefcase, Banknote, Award];

export function WhyParticipateSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const reasons = content?.whyReasons || [];

  return (
    <section id="why" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Why Participate
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Tangible advantages that turn a weekend hackathon into career momentum and prototype validation.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((item, index) => {
            const Icon = iconList[index % iconList.length] || Rocket;
            return (
              <motion.article
                key={`${item.title}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex flex-col justify-between rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition hover:shadow-md hover:border-stone-400"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF0EB] dark:bg-[var(--primary-soft)] text-[var(--primary)] transition group-hover:scale-105">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-sans text-lg font-bold text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.blurb}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
