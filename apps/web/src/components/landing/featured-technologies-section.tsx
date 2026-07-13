"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const technologies = [
  {
    name: "Arduino",
    blurb: "Rapid prototyping boards for sensors and actuators.",
    href: "https://docs.arduino.cc/",
  },
  {
    name: "Raspberry Pi",
    blurb: "Linux SBC for gateways, vision, and edge services.",
    href: "https://www.raspberrypi.com/documentation/",
  },
  {
    name: "ESP32",
    blurb: "Wi-Fi/BLE MCU family for connected edge nodes.",
    href: "https://docs.espressif.com/projects/esp-idf/",
  },
  {
    name: "STM32",
    blurb: "High-performance MCUs for industrial and robotics.",
    href: "https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html",
  },
  {
    name: "MQTT",
    blurb: "Lightweight pub/sub messaging for IoT fleets.",
    href: "https://mqtt.org/",
  },
  {
    name: "LoRa",
    blurb: "Long-range, low-power wide area connectivity.",
    href: "https://lora-alliance.org/",
  },
  {
    name: "BLE",
    blurb: "Short-range wireless for wearables and beacons.",
    href: "https://www.bluetooth.com/learn-about-bluetooth/tech-overview/",
  },
  {
    name: "Zigbee",
    blurb: "Mesh networking for home and industrial sensors.",
    href: "https://csa-iot.org/all-solutions/zigbee/",
  },
  {
    name: "Node-RED",
    blurb: "Flow-based wiring of hardware, APIs, and dashboards.",
    href: "https://nodered.org/docs/",
  },
  {
    name: "Docker",
    blurb: "Containerize services for reproducible demos.",
    href: "https://docs.docker.com/",
  },
  {
    name: "Python",
    blurb: "Scripting, analytics, and ML glue for prototypes.",
    href: "https://docs.python.org/3/",
  },
  {
    name: "TensorFlow Lite",
    blurb: "On-device ML inference for edge AI tracks.",
    href: "https://www.tensorflow.org/lite",
  },
  {
    name: "OpenCV",
    blurb: "Computer vision toolkit for cameras and robots.",
    href: "https://docs.opencv.org/",
  },
  {
    name: "Hailo AI",
    blurb: "Edge AI accelerators for real-time vision.",
    href: "https://hailo.ai/",
  },
  {
    name: "Edge Impulse",
    blurb: "End-to-end ML for embedded and TinyML builds.",
    href: "https://docs.edgeimpulse.com/",
  },
];

export function FeaturedTechnologiesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="technologies" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Featured Technologies
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Stacks you will touch across hardware, connectivity, and edge AI.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <motion.a
              key={tech.name}
              href={tech.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 6) * 0.04 }}
              className="tech-float group rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1.5 hover:rotate-1 hover:border-sky-400/40 hover:shadow-[0_0_28px_rgba(56,189,248,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] motion-reduce:transform-none motion-reduce:animate-none"
              style={
                reduceMotion
                  ? undefined
                  : { animationDelay: `${(index % 5) * 0.4}s` }
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 to-violet-500/20 font-display text-sm font-bold text-sky-100">
                  {tech.name.slice(0, 2).toUpperCase()}
                </div>
                <ExternalLink
                  className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">
                {tech.name}
              </h3>
              <p className="mt-2 text-sm text-muted">{tech.blurb}</p>
              <span className="mt-3 inline-block font-mono text-[11px] text-sky-300">
                Documentation →
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
