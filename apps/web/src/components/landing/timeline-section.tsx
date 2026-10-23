"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContent } from "@/store/content-context";

export function TimelineSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const milestones = content?.timeline || [];

  const downloadIcs = (item: (typeof milestones)[number]) => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NIRAL 2026//Hackathon Portal//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${item.title}`,
      `DESCRIPTION:${item.description}`,
      `LOCATION:${item.venue}`,
      "DTSTART;VALUE=DATE:20261203",
      "DTEND;VALUE=DATE:20261205",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="timeline" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              December 3–4, 2026 · Asia/Kolkata
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Event Timeline & Milestones
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Official hackathon dates are confirmed for December 3–4, 2026. The detailed checkpoint and mentorship schedule is currently being finalized.
            </p>
          </div>
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3.5 py-2 text-xs text-sky-200">
            Detailed session timings to be announced
          </div>
        </div>

        <div className="relative mt-10 pl-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-[2px] before:bg-[var(--card-border)]">
          {milestones.map((item, index) => (
            <motion.div
              key={`${item.title}-${index}`}
              initial={reduceMotion ? false : { opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative mb-8 last:mb-0"
            >
              <div
                className="absolute -left-[31px] top-2 h-3.5 w-3.5 rounded-full border-2 border-[var(--primary)] bg-white dark:bg-[#181513]"
                aria-hidden
              />
              <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-stone-400">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                      {item.date} · {item.time}
                    </span>
                    <span className="text-xs text-[var(--muted)]">· {item.venue}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadIcs(item)}
                    className="h-7 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" /> .ics
                  </Button>
                </div>
                <h3 className="mt-2 font-sans text-lg font-bold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
