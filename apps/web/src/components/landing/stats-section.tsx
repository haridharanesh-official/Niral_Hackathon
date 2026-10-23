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
      iconBg: "bg-[#EDFBF1] text-[#16A34A]",
      info: "Official hackathon dates in Asia/Kolkata timezone",
    },
    {
      id: "timezone",
      label: "Official Timezone",
      value: "IST",
      badge: "UTC+5:30",
      icon: Clock,
      iconBg: "bg-[#EEF4FF] text-[#2563EB]",
      info: "Standard Asia/Kolkata time for all deadlines and schedules",
    },
    {
      id: "mode",
      label: "Event Mode",
      value: "Hybrid",
      badge: "Format",
      icon: Package,
      iconBg: "bg-[#FFF4E6] text-[#D97706]",
      info: "Onsite collaboration and digital submission platform",
    },
    {
      id: "tracks",
      label: "Tracks & Guidelines",
      value: "TBA",
      badge: "Coming Soon",
      icon: Trophy,
      iconBg: "bg-[#E6FAF8] text-[#0891B2]",
      info: "Official problem tracks, capacity, and rubric to be announced",
    },
  ];

  return (
    <section
      id="overview"
      className="scroll-mt-24 py-10"
      aria-label="Event Overview"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              NIRAL 2026 Scope
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Event Parameters & Foundation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Range Pill */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span>1 Nov, 2025 - 30 Nov, 2025</span>
            </div>

            {/* Today Filter Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm cursor-pointer hover:border-stone-400">
              <Calendar className="h-3.5 w-3.5 text-[var(--muted)]" />
              <span>Today</span>
              <ChevronDown className="h-3 w-3 text-[var(--muted)]" />
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

                <div className="mt-3">
                  <p className="text-xs font-medium text-[var(--muted)] truncate">
                    {card.label}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="font-sans text-2xl font-bold tabular-nums text-[var(--foreground)]">
                      {typeof card.value === "number" ? (
                        <AnimatedCounter value={card.value} />
                      ) : (
                        card.value
                      )}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#EAFBF1] dark:bg-emerald-950/40 px-1.5 py-0.5 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400">
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
