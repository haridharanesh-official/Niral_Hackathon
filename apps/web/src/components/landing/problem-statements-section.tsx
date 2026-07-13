"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Problem = {
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  reward: string;
  duration: string;
  objectives: string[];
  requirements: string[];
  components: string[];
  deliverables: string[];
  judging: string[];
  links: { label: string; href: string }[];
};

const problems: Problem[] = [
  {
    title: "Smart Warehouse Automation",
    difficulty: "Advanced",
    category: "Industrial IoT",
    reward: "Special Innovation Award",
    duration: "24 Hours",
    objectives: [
      "Automate inventory location tracking",
      "Detect anomalous movement on the floor",
      "Surface ops alerts within 5 seconds",
    ],
    requirements: [
      "Working prototype or digital twin",
      "MQTT or REST telemetry stream",
      "Operator dashboard",
    ],
    components: ["ESP32 / RPi", "RFID or CV camera", "Relay / actuator"],
    deliverables: ["Demo video", "Architecture diagram", "Repo + README"],
    judging: ["Innovation", "Reliability", "Scalability", "UX"],
    links: [{ label: "Warehouse IoT primer", href: "#resources" }],
  },
  {
    title: "Precision Irrigation Advisor",
    difficulty: "Intermediate",
    category: "Smart Agriculture",
    reward: "AgriTech Track Prize",
    duration: "18 Hours",
    objectives: [
      "Fuse soil + weather signals",
      "Recommend irrigation windows",
      "Reduce water use vs baseline",
    ],
    requirements: ["Sensor ingest", "Rule or ML model", "Mobile/web alert"],
    components: ["Soil moisture probe", "LoRa node", "Gateway"],
    deliverables: ["Live demo", "Water savings estimate", "Field log"],
    judging: ["Impact", "Technical depth", "Feasibility"],
    links: [{ label: "Soil sensing guide", href: "#resources" }],
  },
  {
    title: "Remote Patient Vitals Mesh",
    difficulty: "Advanced",
    category: "Healthcare IoT",
    reward: "HealthTech Sponsor Challenge",
    duration: "24 Hours",
    objectives: [
      "Stream vitals securely",
      "Detect falls or hypoxia events",
      "Notify caregivers with priority",
    ],
    requirements: ["BLE wearable path", "Privacy-aware storage", "Alert SLA"],
    components: ["Pulse ox / IMU", "ESP32-C3", "Phone gateway"],
    deliverables: ["Consent flow", "Alert demo", "Threat model notes"],
    judging: ["Safety", "Privacy", "Reliability", "Presentation"],
    links: [{ label: "Wearables checklist", href: "#resources" }],
  },
  {
    title: "Campus Energy Twin",
    difficulty: "Intermediate",
    category: "Energy Management",
    reward: "Green Innovation Award",
    duration: "20 Hours",
    objectives: [
      "Model building load profiles",
      "Highlight peak waste windows",
      "Suggest actionable setpoints",
    ],
    requirements: ["Time-series dashboard", "At least one control suggestion"],
    components: ["Smart meters / clamps", "RPi gateway", "Cloud or local TSDB"],
    deliverables: ["Dashboard", "Savings hypothesis", "Ops playbook"],
    judging: ["Clarity", "Analytics quality", "Actionability"],
    links: [{ label: "Energy analytics pack", href: "#resources" }],
  },
];

export function ProblemStatementsSection() {
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(problems[0]?.title ?? null);

  return (
    <section id="problems" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Problem Statements
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Featured challenges — expand a card for objectives, kits, and judging.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous problems"
              onClick={() =>
                scrollerRef.current?.scrollBy({
                  left: -320,
                  behavior: "smooth",
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next problems"
              onClick={() =>
                scrollerRef.current?.scrollBy({
                  left: 320,
                  behavior: "smooth",
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
        >
          {problems.map((problem, index) => {
            const expanded = open === problem.title;
            return (
              <motion.article
                key={problem.title}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="glass w-[min(100%,22rem)] shrink-0 snap-start rounded-3xl p-5"
              >
                <h3 className="font-display text-lg font-semibold text-white">
                  {problem.title}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Difficulty
                    </dt>
                    <dd className="mt-1 text-sky-200">{problem.difficulty}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Category
                    </dt>
                    <dd className="mt-1 text-white">{problem.category}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Reward
                    </dt>
                    <dd className="mt-1 text-violet-200">{problem.reward}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Duration
                    </dt>
                    <dd className="mt-1 font-mono text-white">{problem.duration}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200 transition hover:border-sky-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpen(expanded ? null : problem.title)
                  }
                >
                  {expanded ? "Hide details" : "Expand view"}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition",
                      expanded && "rotate-180",
                    )}
                  />
                </button>

                {expanded ? (
                  <div className="mt-4 space-y-4 border-t border-white/10 pt-4 text-sm text-muted">
                    <Detail title="Objectives" items={problem.objectives} />
                    <Detail title="Requirements" items={problem.requirements} />
                    <Detail
                      title="Suggested components"
                      items={problem.components}
                    />
                    <Detail
                      title="Expected deliverables"
                      items={problem.deliverables}
                    />
                    <Detail title="Judging criteria" items={problem.judging} />
                    <div>
                      <p className="font-display text-xs font-semibold text-white">
                        Reference links
                      </p>
                      <ul className="mt-1 space-y-1">
                        {problem.links.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              className="text-sky-300 hover:underline"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
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

function Detail({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-display text-xs font-semibold text-white">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}
