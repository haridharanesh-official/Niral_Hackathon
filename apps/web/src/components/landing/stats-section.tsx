"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  Clock,
  Info,
  Package,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
  Trophy,
} from "lucide-react";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { useAppContent } from "@/store/content-context";

export function StatsSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const s = content?.statistics;
  const event = content?.event;

  const statCards = [
    {
      id: "dates",
      label: "Event Dates",
      value: "Dec 3–4",
      badge: "2026",
      icon: Calendar,
      iconBg: "bg-emerald-500/10 text-emerald-500",
      info: "Official hackathon dates in Asia/Kolkata timezone",
    },
    {
      id: "timezone",
      label: "Official Timezone",
      value: "IST",
      badge: "UTC+5:30",
      icon: Clock,
      iconBg: "bg-blue-500/10 text-blue-500",
      info: "Standard Asia/Kolkata time for all deadlines and schedules",
    },
    {
      id: "venue",
      label: "Host Campus",
      value: "Sri Shakthi IET",
      badge: "Coimbatore",
      icon: Users,
      iconBg: "bg-amber-500/10 text-amber-500",
      info: "Sri Shakthi Institute of Engineering and Technology, Tamil Nadu",
    },
    {
      id: "format",
      label: "Event Format",
      value: "Hybrid / Onsite",
      badge: "36 Hours",
      icon: Package,
      iconBg: "bg-purple-500/10 text-purple-500",
      info: "Onsite hardware labs with online submission and telemetry support",
    },
    {
      id: "duration",
      label: "Sprint Duration",
      value: "36 Hours",
      badge: "Non-stop",
      icon: Clock,
      iconBg: "bg-rose-500/10 text-rose-500",
      info: "Continuous prototyping, mentor check-ins, and live hardware demonstrations",
    },
    {
      id: "tracks",
      label: "Problem Tracks",
      value: "6 Tracks",
      badge: "Active",
      icon: Trophy,
      iconBg: "bg-cyan-500/10 text-cyan-500",
      info: "Industrial Automation, Smart Agriculture, Healthcare IoT, Smart Cities, Energy, AI+IoT",
    },
  ];

  return (
    <section
      id="stats"
      className="scroll-mt-24 py-12"
      aria-label="Event Parameters"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              NIRAL Hackathon 2026 Foundation
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Event Parameters & Specifications
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>December 3–4, 2026 · Coimbatore</span>
            </div>
          </div>
        </div>

        {/* 6-Card Overview Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm transition hover:shadow-md hover:border-stone-400"
              >
                {/* Top Row: Icon + Label + Info */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    title={card.info}
                    aria-label={`Info for ${card.label}`}
                    className="text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <Info className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-[var(--muted)] truncate">
                    {card.label}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                      {card.value}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                      {card.badge}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
