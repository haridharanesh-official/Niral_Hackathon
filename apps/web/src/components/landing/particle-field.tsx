"use client";

import { useEffect, useRef } from "react";

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let frame = 0;
    let raf = 0;
    const particleCount = reduceMotion ? 18 : 48;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * (reduceMotion ? 0 : 0.00035),
      vy: (Math.random() - 0.5) * (reduceMotion ? 0 : 0.00035),
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }

        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        const pulse = reduceMotion
          ? 0.55
          : 0.45 + Math.sin(frame * 0.02 + p.x * 10) * 0.25;

        ctx.beginPath();
        ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = (a.x - b.x) * canvas.width;
          const dy = (a.y - b.y) * canvas.height;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(167, 139, 250, ${0.18 * (1 - dist / 140)})`;
            ctx.beginPath();
            ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
            ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
            ctx.stroke();
          }
        }
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 opacity-70"
      aria-hidden
    />
  );
}
