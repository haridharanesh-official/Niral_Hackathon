"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Cpu, Radio, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/landing/animated-counter";

const aboutStats = [
  {
    label: "Participants",
    render: (n: number) => `${n.toLocaleString("en-IN")}+`,
    value: 2500,
  },
  {
    label: "Teams",
    render: (n: number) => `${n}+`,
    value: 600,
  },
  {
    label: "Mentors",
    render: (n: number) => `${n}+`,
    value: 30,
  },
  {
    label: "Industry Partners",
    render: (n: number) => `${n}+`,
    value: 15,
  },
  {
    label: "Innovation",
    render: (n: number) => `${n} Hours`,
    value: 72,
  },
  {
    label: "Prize Pool",
    render: (n: number) => `₹${n.toLocaleString("en-IN")}+`,
    value: 500000,
  },
] as const;

export function AboutSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-20">
      <div
        className="pointer-events-none absolute inset-0 pcb-traces opacity-30 animate-pulse-glow motion-reduce:animate-none"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-sky-300">
          About HackOS
        </p>

        <div className="mt-6 grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Empowering the Next Generation of Innovators
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              The HackOS IoT Innovation Hackathon is a research-driven platform
              designed to bring together students, innovators, engineers,
              researchers, startups, and industry professionals to solve
              real-world problems using Internet of Things (IoT), Artificial
              Intelligence (AI), Robotics, Cloud Computing, and Embedded Systems.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Participants collaborate, build functional prototypes, interact with
              mentors, compete in challenges, and showcase innovative solutions
              that have the potential to create meaningful impact across
              industries — powered by our IoT Lab and institutional partners.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {aboutStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="glass rounded-2xl px-3 py-4 text-center"
                >
                  <p className="font-mono text-lg font-bold tabular-nums text-white sm:text-xl">
                    <AnimatedCounter value={stat.value} format={stat.render} />
                  </p>
                  <p className="mt-1 text-xs text-muted">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8">
              <a href="#themes">
                <Button className="cta-primary">
                  Learn More
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center"
            aria-hidden
          >
            <div className="absolute inset-8 rounded-full border border-sky-400/20 animate-spin-slow motion-reduce:animate-none" />
            <div className="absolute inset-16 rounded-full border border-violet-400/15 animate-spin-slow-reverse motion-reduce:animate-none" />
            <div className="glow-ring relative flex h-56 w-56 items-center justify-center rounded-[2rem] border border-sky-400/30 bg-gradient-to-br from-sky-500/20 via-[#0a1228] to-violet-500/20 animate-float-orb motion-reduce:animate-none">
              <Cpu className="h-16 w-16 text-sky-300" />
              <Wifi className="absolute -right-4 top-8 h-8 w-8 text-cyan-300 animate-pulse-glow motion-reduce:animate-none" />
              <Radio className="absolute -left-3 bottom-10 h-7 w-7 text-violet-300 animate-pulse-glow motion-reduce:animate-none [animation-delay:1s]" />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-sky-200">
                IoT LAB · 3D CORE
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
