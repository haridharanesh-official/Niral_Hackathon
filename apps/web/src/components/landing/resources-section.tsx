"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Calendar, FileText, Gamepad2 } from "lucide-react";

const resources = [
  {
    icon: FileText,
    title: "Rulebook",
    blurb: "Eligibility, submission formats, and judging rubrics.",
    href: "/register",
  },
  {
    icon: Calendar,
    title: "Workshop schedule",
    blurb: "Mentor clinics and track deep-dives across the weekend.",
    href: "#timeline",
  },
  {
    icon: BookOpen,
    title: "Starter kits",
    blurb: "Firmware templates, dataset links, and API keys guide.",
    href: "/ai",
  },
  {
    icon: Gamepad2,
    title: "Practice arena",
    blurb: "Warm up with quizzes and skill games before kickoff.",
    href: "/games",
  },
];

export function ResourcesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="resources" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">Resources</h2>
        <p className="mt-3 max-w-xl text-muted">
          Everything you need before you register — rules, kits, and practice.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((item, index) => (
            <motion.div
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className="block h-full rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-sky-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <item.icon className="h-5 w-5 text-sky-300" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{item.blurb}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
