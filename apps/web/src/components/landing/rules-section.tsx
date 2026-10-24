"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ShieldAlert, Users, Lightbulb, FileCode, Award } from "lucide-react";

export function RulesSection() {
  const reduceMotion = useReducedMotion();

  const rules = [
    {
      icon: Users,
      title: "Team Composition",
      badge: "2–4 Members",
      points: [
        "Teams can have between 2 to 4 registered members.",
        "Interdisciplinary teams (e.g. ECE + CSE + Mech) and cross-college members are welcome.",
        "Every member must complete registration before the deadline.",
      ],
    },
    {
      icon: Award,
      title: "Eligibility Criteria",
      badge: "Pan-India",
      points: [
        "Open to all undergraduate, postgraduate students, and tech enthusiasts.",
        "Valid college/institution ID or government identity proof is mandatory for check-in.",
        "Both individual registration and team linking are supported on the portal.",
      ],
    },
    {
      icon: FileCode,
      title: "Development & Originality",
      badge: "Authenticity",
      points: [
        "All prototype hardware connections and software repositories must be started during the hackathon.",
        "Open-source libraries, frameworks, APIs, and public firmware are permitted.",
        "Plagiarism, pre-built proprietary software, or purchased complete projects lead to disqualification.",
      ],
    },
    {
      icon: Lightbulb,
      title: "Evaluation & Rubric",
      badge: "Objective",
      points: [
        "Evaluation criteria: Innovation (25%), Technical Depth (25%), Hardware Execution (20%), Feasibility (15%), Presentation (15%).",
        "Teams must demonstrate a live working prototype during the judging rounds.",
        "Decisions made by the judging panel are final and binding.",
      ],
    },
    {
      icon: CheckCircle2,
      title: "Intellectual Property",
      badge: "100% Yours",
      points: [
        "Participants retain 100% intellectual property ownership of whatever they invent.",
        "Organizers and sponsors claim zero equity or IP rights over team prototypes.",
        "Teams may showcase, commercialize, or publish their solutions after the event.",
      ],
    },
    {
      icon: ShieldAlert,
      title: "Code of Conduct",
      badge: "Zero Tolerance",
      points: [
        "Maintain a safe, welcoming, and collaborative atmosphere for everyone.",
        "Harassment, discrimination, and unsportsmanlike behavior will not be tolerated.",
        "Adhere to lab safety guidelines when working with electrical and soldering equipment.",
      ],
    },
  ];

  return (
    <section id="rules" className="scroll-mt-24 py-16" aria-label="Rules and Eligibility">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              NIRAL 2026 Guidelines
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Rules & Eligibility
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Clear, transparent rules to ensure fair competition, security, and a level playing field for every participant.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={rule.title}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition hover:border-stone-400 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                      {rule.badge}
                    </span>
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[var(--foreground)]">
                    {rule.title}
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-[var(--muted)] leading-relaxed">
                    {rule.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-[var(--primary)] font-bold">·</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
