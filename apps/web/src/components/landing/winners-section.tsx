"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ExternalLink,
  FileText,
  Github,
  Play,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Winner = {
  place: "Winner" | "Runner-up" | "Third Place";
  medal: string;
  cover: string;
  project: string;
  team: string;
  college: string;
  theme: string;
  technologies: string[];
  description: string;
  awards: string[];
  github: string;
  demo: string;
  caseStudy: string;
  teamInfo: {
    leader: string;
    members: string[];
    department: string;
    year: string;
    mentors: string[];
  };
  overview: {
    problem: string;
    objectives: string[];
    architecture: string;
    hardware: string[];
    software: string[];
    aiModels: string[];
    deployment: string;
    impact: string;
    future: string;
  };
  media: string[];
  awardPath: string[];
};

const winners: Winner[] = [
  {
    place: "Winner",
    medal: "🥇",
    cover: "from-amber-400/40 via-sky-500/20 to-violet-600/30",
    project: "PulseGrid",
    team: "Circuit Wolves",
    college: "NIT Innovation Campus",
    theme: "Smart Cities",
    technologies: ["ESP32", "MQTT", "Python", "OpenCV", "Firebase"],
    description:
      "City-scale air quality mesh with on-device anomaly detection and municipal ops alerts.",
    awards: ["Overall Winner 2025", "Best Hardware Integration"],
    github: "https://github.com/",
    demo: "#gallery",
    caseStudy: "#success-stories",
    teamInfo: {
      leader: "Ananya Rao",
      members: ["Dev Shah", "Meera Iyer", "Kabir Sen"],
      department: "Electronics & IoT",
      year: "2026",
      mentors: ["Dr. L. Menon", "Priya Nair"],
    },
    overview: {
      problem: "Sparse, delayed air-quality readings across campus zones.",
      objectives: [
        "Sub-minute sensor reporting",
        "On-device anomaly flags",
        "Ops dashboard for facilities",
      ],
      architecture:
        "ESP32 nodes → MQTT broker → edge CV gateway → Firebase + ops console.",
      hardware: ["ESP32-S3", "PMS5003", "BME280", "Solar kits"],
      software: ["MicroPython", "Node-RED", "React dashboard"],
      aiModels: ["Isolation Forest (edge)", "OpenCV plume heuristic"],
      deployment: "48 nodes across 6 buildings; 14-day pilot.",
      impact: "42% faster incident response vs manual sampling.",
      future: "City partnership + patent filing on mesh routing.",
    },
    media: ["Field deploy", "Circuit board", "Dashboard", "Prototype"],
    awardPath: [
      "Winner",
      "State Level",
      "National Selection",
      "Startup Incubation",
      "Patent Filed",
      "Commercial Deployment",
    ],
  },
  {
    place: "Runner-up",
    medal: "🥈",
    cover: "from-slate-300/30 via-cyan-500/20 to-sky-700/30",
    project: "MentorForge",
    team: "Neon Flux",
    college: "State Tech University",
    theme: "AI + IoT",
    technologies: ["Python", "TensorFlow Lite", "Raspberry Pi", "Docker"],
    description:
      "AI mentor that generated architecture docs and pitch decks live during checkpoints.",
    awards: ["Runner-up 2025", "Best AI Application"],
    github: "https://github.com/",
    demo: "#gallery",
    caseStudy: "#success-stories",
    teamInfo: {
      leader: "Dev Patel",
      members: ["Sara Khan", "Owen Lee"],
      department: "Computer Science",
      year: "2025",
      mentors: ["Prof. A. Gupta"],
    },
    overview: {
      problem: "Teams lost hours drafting docs instead of shipping hardware.",
      objectives: ["Live architecture drafts", "Pitch rehearsal coach"],
      architecture: "RPi edge agent → LLM API → markdown + slide export.",
      hardware: ["Raspberry Pi 5", "USB mic"],
      software: ["FastAPI", "Next.js", "Docker"],
      aiModels: ["TFLite intent classifier", "Hosted LLM"],
      deployment: "Used by 18 teams during finals weekend.",
      impact: "Average 2.1h saved on documentation per team.",
      future: "Open-source mentor pack for campuses.",
    },
    media: ["UI mock", "Edge box", "Pitch assist"],
    awardPath: ["Runner-up", "State Level", "Incubation Shortlist"],
  },
  {
    place: "Third Place",
    medal: "🥉",
    cover: "from-orange-400/25 via-rose-500/15 to-violet-700/25",
    project: "Lockbyte",
    team: "Packet Ghosts",
    college: "Metro Engineering College",
    theme: "Industrial Automation",
    technologies: ["STM32", "Arduino", "MQTT", "Python"],
    description:
      "Firmware attestation toolkit for campus IoT fleets with supply-chain checks.",
    awards: ["Third Place 2025", "Security Spotlight"],
    github: "https://github.com/",
    demo: "#gallery",
    caseStudy: "#success-stories",
    teamInfo: {
      leader: "Riya Bose",
      members: ["Arjun Das", "Nina Park"],
      department: "Cyber-Physical Systems",
      year: "2027",
      mentors: ["Eng. H. Ortiz"],
    },
    overview: {
      problem: "Unaudited firmware updates on shared lab devices.",
      objectives: ["Attest boots", "Detect tampering", "Ops alerts"],
      architecture: "STM32 secure boot → MQTT attest events → Python verifier.",
      hardware: ["STM32 Nucleo", "Arduino bridge", "HSMs (sim)"],
      software: ["C firmware", "Python verifier", "Grafana"],
      aiModels: ["Anomaly rules on attest timing"],
      deployment: "Lab pilot on 30 devices.",
      impact: "Blocked 3 unsigned update attempts in demo week.",
      future: "Partner with campus IT for fleet rollout.",
    },
    media: ["PCB", "Attest logs", "Bench setup"],
    awardPath: ["Third Place", "Security Track", "Lab Adoption"],
  },
];

export function WinnersSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<Winner | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <section id="winners" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Hall of Innovation
          </h2>
          <p className="mt-3 text-muted">
            Meet the Champions of Previous Editions
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {winners.map((item, index) => (
            <motion.article
              key={item.project}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="winner-card group glass overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_16px_40px_rgba(56,189,248,0.2)] motion-reduce:transform-none"
            >
              <div
                className={cn(
                  "relative h-40 overflow-hidden bg-gradient-to-br",
                  item.cover,
                )}
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.12)_50%,transparent_60%)] opacity-60" />
                <div className="absolute inset-0 scale-100 transition duration-500 group-hover:scale-110 motion-reduce:transition-none" />
                <span className="absolute left-4 top-4 text-2xl" aria-hidden>
                  {item.medal}
                </span>
                <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90">
                  {item.place}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-white">
                  {item.project}
                </h3>
                <p className="mt-1 text-sm text-sky-200">{item.team}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {item.college} · {item.theme}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted">
                  {item.description}
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-200">
                  {item.awards[0]}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                  <a href={item.github} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="secondary">
                      <Github className="h-3.5 w-3.5" aria-hidden />
                      GitHub
                    </Button>
                  </a>
                  <a href={item.demo}>
                    <Button size="sm" variant="secondary">
                      <Play className="h-3.5 w-3.5" aria-hidden />
                      Demo
                    </Button>
                  </a>
                  <Button size="sm" className="cta-primary" onClick={() => setActive(item)}>
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Case Study
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-modal-title"
          onClick={() => setActive(null)}
        >
          <div
            className="glass mx-auto my-6 max-w-4xl rounded-3xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300">
                  {active.medal} {active.place}
                </p>
                <h3
                  id="winner-modal-title"
                  className="mt-2 font-display text-3xl font-bold text-white"
                >
                  {active.project}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white"
                aria-label="Close case study"
                onClick={() => setActive(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={cn(
                "mt-6 h-48 rounded-3xl bg-gradient-to-br sm:h-64",
                active.cover,
              )}
            />

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h4 className="font-display text-sm font-semibold text-white">
                  Team information
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li>Leader · {active.teamInfo.leader}</li>
                  <li>Members · {active.teamInfo.members.join(", ")}</li>
                  <li>College · {active.college}</li>
                  <li>Department · {active.teamInfo.department}</li>
                  <li>Graduation · {active.teamInfo.year}</li>
                  <li>Mentors · {active.teamInfo.mentors.join(", ")}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-white">
                  Project overview
                </h4>
                <p className="mt-2 text-sm text-muted">
                  <span className="text-sky-300">Problem · </span>
                  {active.overview.problem}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="text-sky-300">Architecture · </span>
                  {active.overview.architecture}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="text-sky-300">Impact · </span>
                  {active.overview.impact}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="text-sky-300">Future · </span>
                  {active.overview.future}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stack title="Hardware" items={active.overview.hardware} />
              <Stack title="Software" items={active.overview.software} />
              <Stack title="AI models" items={active.overview.aiModels} />
            </div>

            <div className="mt-6">
              <h4 className="font-display text-sm font-semibold text-white">
                Media gallery
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {active.media.map((m) => (
                  <div
                    key={m}
                    className="flex h-20 items-end rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-muted"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-display text-sm font-semibold text-white">
                Awards timeline
              </h4>
              <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                {active.awardPath.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-sky-100">
                      {step}
                    </span>
                    {i < active.awardPath.length - 1 ? (
                      <span className="text-sky-400/60">↓</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={active.github} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  <Github className="h-4 w-4" /> GitHub
                </Button>
              </a>
              <a href={active.demo}>
                <Button variant="secondary">
                  <Play className="h-4 w-4" /> Watch Demo
                </Button>
              </a>
              <a href={active.caseStudy}>
                <Button className="cta-primary">
                  <Trophy className="h-4 w-4" /> Success path
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stack({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="font-display text-xs font-semibold text-white">{title}</h5>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}
