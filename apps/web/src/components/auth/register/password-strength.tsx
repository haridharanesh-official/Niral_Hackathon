"use client";

import { cn } from "@/lib/utils";
import { passwordStrength } from "@/components/auth/register/schema";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  const width = `${(score / 4) * 100}%`;
  const color =
    score <= 1
      ? "bg-rose-400"
      : score === 2
        ? "bg-orange-400"
        : score === 3
          ? "bg-sky-400"
          : "bg-emerald-400";

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full transition-[width] duration-300", color)}
          style={{ width }}
        />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Strength · <span className="text-sky-200">{label}</span>
      </p>
    </div>
  );
}
