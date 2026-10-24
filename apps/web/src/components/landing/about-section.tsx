"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { useAppContent } from "@/store/content-context";

export function AboutSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const event = content?.event;

  const aboutPillars = [
    {
      title: "36-Hour Sprint",
      subtitle: "Continuous building, debugging, and live hardware prototyping on-site.",
      badge: "Format",
    },
    {
      title: "Hardware & Edge AI",
      subtitle: "ESP32, STM32, Raspberry Pi, industrial telemetry, and embedded vision.",
      badge: "Focus",
    },
    {
      title: "Organized by IoT Club",
      subtitle: "Hosted at Sri Shakthi Institute of Engineering and Technology.",
      badge: "Host",
    },
    {
      title: "National Participation",
      subtitle: "Open to engineering students, developers, and makers across India.",
      badge: "Eligibility",
    },
  ];

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-16">
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
          About NIRAL Hackathon 2026
        </p>

        <div className="mt-4 grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
              Empowering the Next Generation of IoT & Hardware Innovators
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {event?.description ||
                "NIRAL Hackathon 2026 is a flagship hackathon hosted by the IoT Club at Sri Shakthi Institute of Engineering and Technology. Over 36 intensive hours, teams converge on campus to tackle critical real-world challenges in industrial automation, healthcare, precision agriculture, smart cities, and edge AI."}
            </p>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Participants receive hands-on mentoring from industry experts, access to testing hardware components, and evaluation under a transparent, objective rubric.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#tracks">
                <Button size="md" className="cta-primary">
                  Explore Tracks <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <a href="#rules">
                <Button size="md" variant="secondary">
                  Rules & Eligibility
                </Button>
              </a>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aboutPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-stone-400"
              >
                <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                  {pillar.badge}
                </span>
                <h3 className="mt-3 font-sans text-base font-bold text-[var(--foreground)]">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                  {pillar.subtitle}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
