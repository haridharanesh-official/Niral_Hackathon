"use client";

export function AnimatedBackground({
  parallax = { x: 0, y: 0 },
  reduceMotion,
}: {
  parallax?: { x: number; y: number };
  reduceMotion?: boolean | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm organic sand grid */}
      <div className="circuit-grid absolute inset-0 opacity-40" />

      {/* Ambient warm terracotta & amber glow orbs */}
      <div
        className="animate-float-orb absolute -left-20 top-16 h-96 w-96 rounded-full bg-[var(--primary)]/10 blur-3xl motion-reduce:animate-none"
        style={{
          transform: reduceMotion
            ? undefined
            : `translate(${parallax.x * -0.4}px, ${parallax.y * -0.3}px)`,
        }}
      />
      <div
        className="animate-float-orb absolute right-0 top-32 h-[28rem] w-[28rem] rounded-full bg-[var(--accent)]/10 blur-3xl motion-reduce:animate-none [animation-delay:1.6s]"
        style={{
          transform: reduceMotion
            ? undefined
            : `translate(${parallax.x * 0.4}px, ${parallax.y * 0.3}px)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(140, 59, 35, 0.06), transparent 60%), linear-gradient(180deg, transparent 65%, var(--background) 100%)",
        }}
      />
    </div>
  );
}
