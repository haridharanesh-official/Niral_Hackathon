"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, Bell, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const tracks = [
  {
    name: "Industrial Automation",
    category: "Telemetry, SCADA & Predictive Maintenance",
    status: "Briefs Coming Soon",
  },
  {
    name: "Smart Agriculture",
    category: "Soil Sensing, LoRaWAN & Precision Irrigation",
    status: "Briefs Coming Soon",
  },
  {
    name: "Healthcare IoT",
    category: "Wearables, BLE Monitoring & Emergency Telemetry",
    status: "Briefs Coming Soon",
  },
  {
    name: "Smart Cities",
    category: "Urban Sensing, Computer Vision & Mobility",
    status: "Briefs Coming Soon",
  },
  {
    name: "Energy Management",
    category: "Grid Monitoring, Metering & Optimization",
    status: "Briefs Coming Soon",
  },
  {
    name: "AI + Edge Computing",
    category: "Constrained Devices, TinyML & Real-time Vision",
    status: "Briefs Coming Soon",
  },
];

export function ProblemStatementsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="problems" className="scroll-mt-24 py-16" aria-label="Problem Statements">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              NIRAL Hackathon 2026 Challenges
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Problem Statements
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Official industry challenge statements and detailed specifications will be published prior to the hackathon kickoff.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              Coming Soon
            </span>
          </div>
        </div>

        {/* 6 Track Preview Cards with Clean Coming Soon Status */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, index) => (
            <motion.div
              key={track.name}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-stone-400 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[var(--muted)] uppercase tracking-wider">
                    <Layers className="h-3 w-3 text-[var(--primary)]" /> Track {index + 1}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                    {track.status}
                  </span>
                </div>
                <h3 className="font-sans text-base font-bold text-[var(--foreground)]">
                  {track.name}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                  {track.category}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>Kit Manifest: TBA</span>
                <span>Rubric: 36h Sprint</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action card */}
        <div className="mt-8 rounded-[24px] border border-[var(--card-border)] bg-[var(--card-subtle)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-sans text-base font-bold text-[var(--foreground)]">
              Want to receive the problem statements the moment they drop?
            </h4>
            <p className="text-xs text-[var(--muted)] mt-1">
              Registered participants and newsletter subscribers will receive prompt notification upon release.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a href="#tracks">
              <Button size="sm" variant="secondary">
                View Domain Overviews
              </Button>
            </a>
            <a href="#newsletter">
              <Button size="sm" className="cta-primary">
                <Bell className="mr-1.5 h-3.5 w-3.5" /> Get Notified
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
