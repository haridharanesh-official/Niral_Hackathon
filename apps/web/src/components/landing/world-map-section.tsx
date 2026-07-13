"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const markers = [
  {
    id: "in",
    name: "India",
    x: "68%",
    y: "48%",
    participants: 980,
    projects: 210,
    awards: 12,
    universities: 48,
  },
  {
    id: "ae",
    name: "UAE",
    x: "58%",
    y: "42%",
    participants: 64,
    projects: 18,
    awards: 2,
    universities: 4,
  },
  {
    id: "sg",
    name: "Singapore",
    x: "78%",
    y: "55%",
    participants: 42,
    projects: 11,
    awards: 1,
    universities: 3,
  },
  {
    id: "de",
    name: "Germany",
    x: "48%",
    y: "28%",
    participants: 38,
    projects: 9,
    awards: 1,
    universities: 5,
  },
  {
    id: "us",
    name: "USA",
    x: "22%",
    y: "36%",
    participants: 55,
    projects: 14,
    awards: 2,
    universities: 6,
  },
];

export function WorldMapSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<(typeof markers)[number] | null>(
    markers[0] ?? null,
  );

  return (
    <section id="world-map" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Interactive World Map
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Participants, partner universities, sponsors, and mentors worldwide.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_center,#0b1a33,transparent_70%),linear-gradient(#07101f,#05070f)]"
          >
            <div className="absolute inset-6 rounded-[40%] border border-sky-400/10" />
            <div className="absolute inset-[18%] rounded-[45%] border border-violet-400/10" />
            {markers.map((m) => (
              <button
                key={m.id}
                type="button"
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                style={{ left: m.x, top: m.y }}
                aria-label={`${m.name} marker`}
                onClick={() => setActive(m)}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-sky-300/50 motion-reduce:animate-none" />
              </button>
            ))}
            <p className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Click a marker
            </p>
          </motion.div>

          <div className="glass rounded-3xl p-6">
            {active ? (
              <>
                <h3 className="font-display text-xl font-semibold text-white">
                  {active.name}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted">Participants</dt>
                    <dd className="font-mono text-lg text-sky-200">
                      {active.participants}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Projects</dt>
                    <dd className="font-mono text-lg text-sky-200">
                      {active.projects}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Awards</dt>
                    <dd className="font-mono text-lg text-sky-200">
                      {active.awards}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Universities</dt>
                    <dd className="font-mono text-lg text-sky-200">
                      {active.universities}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-muted">Select a country marker.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
