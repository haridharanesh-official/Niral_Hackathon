"use client";

import { ParticleField } from "@/components/landing/particle-field";

export function AnimatedBackground({
  parallax = { x: 0, y: 0 },
  reduceMotion,
}: {
  parallax?: { x: number; y: number };
  reduceMotion?: boolean | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 circuit-grid opacity-50" />
      <div className="pcb-traces absolute inset-0 opacity-40" aria-hidden />
      <ParticleField />
      <div
        className="animate-float-orb absolute -left-24 top-20 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl motion-reduce:animate-none"
        style={{
          transform: reduceMotion
            ? undefined
            : `translate(${parallax.x * -0.4}px, ${parallax.y * -0.3}px)`,
        }}
      />
      <div
        className="animate-float-orb absolute right-0 top-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl motion-reduce:animate-none [animation-delay:1.4s]"
        style={{
          transform: reduceMotion
            ? undefined
            : `translate(${parallax.x * 0.5}px, ${parallax.y * 0.35}px)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 70% 40%, rgba(56,189,248,0.18), transparent 55%), linear-gradient(180deg, transparent 55%, #05070f 100%)",
        }}
      />
    </div>
  );
}
