"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const tracks = [
  { name: "Industrial IoT", base: 78 },
  { name: "Healthcare", base: 62 },
  { name: "AI", base: 91 },
  { name: "Agriculture", base: 44 },
  { name: "Cybersecurity", base: 58 },
];

export function InnovationHeatMapSection() {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState(
    Object.fromEntries(tracks.map((t) => [t.name, t.base])),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setValues((prev) =>
        Object.fromEntries(
          tracks.map((t) => {
            const jitter = Math.round((Math.random() * 2 - 1) * 4);
            return [t.name, Math.min(100, Math.max(20, prev[t.name] + jitter))];
          }),
        ),
      );
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="heat-map" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Innovation Heat Map
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Participation intensity by theme — updates dynamically.
        </p>

        <div className="mt-10 space-y-4">
          {tracks.map((track, index) => (
            <motion.div
              key={track.name}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-white">{track.name}</span>
                <span className="font-mono tabular-nums text-sky-300">
                  {values[track.name]}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-[width] duration-700"
                  style={{ width: `${values[track.name]}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
