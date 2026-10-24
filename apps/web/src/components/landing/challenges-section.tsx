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
    resources: [{ label: "Open Geospatial Consortium", href: "https://www.ogc.org/" }],
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
    resources: [{ label: "Modbus Protocol Docs", href: "https://modbus.org/" }],
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
  Beginner: "text-[#15803D] border-[#86EFAC] bg-[#EAFBF1] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  Intermediate: "text-[#B45309] border-[#FED7AA] bg-[#FFF8EC] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  Advanced: "text-[#8C3B23] border-[#FDBA74] bg-[#FBF0EB] dark:bg-[var(--primary-soft)] dark:text-[var(--primary)] dark:border-[#8C3B23]/40",
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
    <section id="tracks" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Event Themes & Problem Tracks
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Challenge domains spanning industry automation, agriculture, healthcare, smart cities, and AI hardware.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous themes"
              onClick={() => scrollBy(-1)}
              className="rounded-full h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next themes"
              onClick={() => scrollBy(1)}
              className="rounded-full h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin"
          role="list"
        >
          {themes.map((theme, index) => (
            <motion.article
              key={theme.title}
              role="listitem"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="flex w-[min(100%,21rem)] shrink-0 snap-start flex-col justify-between rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition hover:shadow-md hover:border-stone-400"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBF0EB] dark:bg-[var(--primary-soft)] text-[var(--primary)]">
                  <theme.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-sans text-xl font-bold text-[var(--foreground)]">
                  {theme.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {theme.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    difficultyTone[theme.difficulty],
                  )}
                >
                  {theme.difficulty}
                </span>
                <Button
                  className="cta-primary text-xs"
                  size="sm"
                  onClick={() => setActive(theme)}
                >
                  Explore
                  <CircuitBoard className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-modal-title"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  Theme detail
                </p>
                <h3
                  id="theme-modal-title"
                  className="mt-1 font-sans text-2xl font-bold text-[var(--foreground)]"
                >
                  {active.title}
                </h3>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--sand-100)] hover:text-[var(--foreground)]"
                aria-label="Close theme details"
                onClick={() => setActive(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              {active.description}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--sand-50)] p-4">
                <h4 className="font-sans text-sm font-semibold text-[var(--foreground)]">
                  Sample projects
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-[var(--muted)]">
                  {active.sampleProjects.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--sand-50)] p-4">
                <h4 className="font-sans text-sm font-semibold text-[var(--foreground)]">
                  Suggested hardware
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-[var(--muted)]">
                  {active.hardware.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-sans text-sm font-semibold text-[var(--foreground)]">
                Reference architecture
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                {active.architecture}
              </p>
            </div>

            <div className="mt-5">
              <h4 className="font-sans text-sm font-semibold text-[var(--foreground)]">
                Technology stack
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-[var(--card-border)] bg-[var(--sand-50)] px-3 py-1 font-mono text-[11px] text-[var(--foreground)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex justify-end">
              <Button size="sm" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
