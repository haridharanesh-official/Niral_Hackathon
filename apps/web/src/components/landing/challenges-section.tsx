"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Factory,
  HeartPulse,
  Leaf,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = {
  icon: typeof Factory;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  technologies: string[];
  sampleProjects: string[];
  architecture: string;
  hardware: string[];
  resources: { label: string; href: string }[];
};

const themes: Theme[] = [
  {
    icon: Factory,
    title: "Industrial Automation",
    description:
      "Develop smart industrial monitoring systems, predictive maintenance solutions, and intelligent manufacturing automation.",
    difficulty: "Advanced",
    technologies: ["PLC", "MQTT", "Raspberry Pi", "ESP32", "SCADA", "Node-RED"],
    sampleProjects: [
      "Predictive vibration monitor for CNC lines",
      "Digital twin of a packaging cell",
      "SCADA bridge with MQTT event bus",
    ],
    architecture:
      "Edge sensors → gateway (ESP32/RPi) → MQTT broker → Node-RED/SCADA dashboards → cloud analytics.",
    hardware: ["ESP32", "Raspberry Pi 4", "Industrial sensors", "Relay modules"],
    resources: [
      { label: "MQTT Essentials", href: "https://mqtt.org/" },
      { label: "Node-RED docs", href: "https://nodered.org/docs/" },
    ],
  },
  {
    icon: Leaf,
    title: "Smart Agriculture",
    description:
      "Build sensing and decision systems for soil health, irrigation, and crop yield optimization.",
    difficulty: "Intermediate",
    technologies: [
      "Soil Sensors",
      "LoRaWAN",
      "AI Crop Monitoring",
      "Weather Prediction",
    ],
    sampleProjects: [
      "LoRa soil moisture mesh for greenhouses",
      "Vision-based pest early warning",
      "Weather-aware irrigation scheduler",
    ],
    architecture:
      "Field sensors → LoRaWAN gateway → cloud ingest → ML models → farmer alerts.",
    hardware: ["Soil NPK probes", "LoRa nodes", "Camera module", "Solar kits"],
    resources: [
      { label: "LoRaWAN overview", href: "https://lora-alliance.org/" },
    ],
  },
  {
    icon: HeartPulse,
    title: "Healthcare IoT",
    description:
      "Design patient monitoring, remote healthcare, smart medical devices, and wearables.",
    difficulty: "Advanced",
    technologies: ["BLE", "Wearables", "Edge AI", "Cloud EHR hooks"],
    sampleProjects: [
      "Remote vitals wearable with fall detection",
      "Smart pill adherence tracker",
      "Clinic waiting-room air quality monitor",
    ],
    architecture:
      "Wearable BLE → phone/gateway → secure API → clinician dashboard + alerts.",
    hardware: ["Pulse oximeter modules", "IMU", "ESP32-C3", "OLED displays"],
    resources: [{ label: "OpenCV", href: "https://opencv.org/" }],
  },
  {
    icon: Building2,
    title: "Smart Cities",
    description:
      "Traffic monitoring, smart parking, waste management, and environmental sensing for urban ops.",
    difficulty: "Intermediate",
    technologies: ["Computer Vision", "MQTT", "GIS", "NB-IoT"],
    sampleProjects: [
      "Adaptive traffic signal assist",
      "Ultrasonic smart parking bay",
      "Fill-level waste bin network",
    ],
    architecture:
      "City sensors/cameras → edge inference → municipal ops console.",
    hardware: ["Camera nodes", "Ultrasonic sensors", "RPi", "GPS modules"],
    resources: [{ label: "Smart city patterns", href: "#resources" }],
  },
  {
    icon: Sun,
    title: "Energy Management",
    description:
      "Solar monitoring, smart grid analytics, power quality, and energy optimization.",
    difficulty: "Intermediate",
    technologies: ["Modbus", "MQTT", "Power Analytics", "Dashboards"],
    sampleProjects: [
      "Rooftop solar performance twin",
      "Campus load-shedding advisor",
      "Appliance-level energy insights",
    ],
    architecture:
      "Meters/inverters → gateway → time-series DB → optimization services.",
    hardware: ["Current clamps", "Smart meters", "RPi", "Relay controllers"],
    resources: [{ label: "Docker deploy guide", href: "#resources" }],
  },
  {
    icon: Zap,
    title: "AI + IoT",
    description:
      "Computer vision, edge AI, predictive analytics, and digital twins on constrained devices.",
    difficulty: "Advanced",
    technologies: [
      "Computer Vision",
      "Edge AI",
      "Predictive Analytics",
      "Digital Twins",
    ],
    sampleProjects: [
      "On-device defect detection with TFLite",
      "Predictive maintenance digital twin",
      "Hailo-accelerated vision pipeline",
    ],
    architecture:
      "Sensors/cameras → edge accelerator → model registry → twin / ops UI.",
    hardware: ["Hailo / Jetson", "USB cams", "ESP32-S3", "IMU packs"],
    resources: [
      { label: "TensorFlow Lite", href: "https://www.tensorflow.org/lite" },
      { label: "Edge Impulse", href: "https://www.edgeimpulse.com/" },
    ],
  },
];

const difficultyTone = {
  Beginner: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
  Intermediate: "text-sky-300 border-sky-400/30 bg-sky-500/10",
  Advanced: "text-orange-300 border-orange-400/30 bg-orange-500/10",
};

export function ChallengesSection() {
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Theme | null>(null);

  const scrollBy = useCallback((dir: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: dir * (node.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <section id="themes" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Event Themes
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Challenge domains spanning industry, agriculture, healthcare, cities,
              energy, and AI + IoT.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous themes"
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next themes"
              onClick={() => scrollBy(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin"
          role="list"
        >
          {themes.map((theme, index) => (
            <motion.article
              key={theme.title}
              role="listitem"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="glass flex w-[min(100%,20rem)] shrink-0 snap-start flex-col rounded-3xl p-6"
            >
              <theme.icon className="h-6 w-6 text-sky-300" aria-hidden />
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                {theme.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {theme.description}
              </p>
              <span
                className={cn(
                  "mt-4 inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  difficultyTone[theme.difficulty],
                )}
              >
                {theme.difficulty}
              </span>
              <Button
                className="cta-primary mt-5 w-full"
                size="sm"
                onClick={() => setActive(theme)}
              >
                Explore
                <CircuitBoard className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </motion.article>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-modal-title"
          onClick={() => setActive(null)}
        >
          <div
            className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300">
                  Theme detail
                </p>
                <h3
                  id="theme-modal-title"
                  className="mt-2 font-display text-2xl font-bold text-white"
                >
                  {active.title}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                aria-label="Close theme details"
                onClick={() => setActive(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              {active.description}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="font-display text-sm font-semibold text-white">
                  Sample projects
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted">
                  {active.sampleProjects.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-white">
                  Suggested hardware
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted">
                  {active.hardware.map((h) => (
                    <li key={h}>· {h}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-display text-sm font-semibold text-white">
                Reference architecture
              </h4>
              <p className="mt-2 text-sm text-muted">{active.architecture}</p>
            </div>

            <div className="mt-5">
              <h4 className="font-display text-sm font-semibold text-white">
                Technology stack
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {active.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 font-mono text-[11px] text-sky-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-display text-sm font-semibold text-white">
                Learning resources
              </h4>
              <ul className="mt-2 space-y-1 text-sm">
                {active.resources.map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      className="text-sky-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        r.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
