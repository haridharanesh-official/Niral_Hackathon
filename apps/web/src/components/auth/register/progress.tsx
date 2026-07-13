"use client";

import { cn } from "@/lib/utils";
import type { RegisterStep } from "@/components/auth/register/schema";

const labels: Record<Exclude<RegisterStep, "landing" | "success">, string> = {
  basic: "Basics",
  academic: "Profile",
  skills: "Skills",
  portfolio: "Portfolio",
  password: "Security",
  consent: "Consent",
};

const order = Object.keys(labels) as Array<keyof typeof labels>;

export function RegistrationProgress({ step }: { step: RegisterStep }) {
  const activeIndex =
    step === "landing" || step === "success"
      ? step === "success"
        ? order.length
        : -1
      : order.indexOf(step as keyof typeof labels);

  return (
    <div className="mb-6" aria-label="Registration progress">
      <ol className="flex flex-wrap gap-2">
        {order.map((key, index) => {
          const done = activeIndex > index || step === "success";
          const current = activeIndex === index;
          return (
            <li
              key={key}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                done && "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
                current && "border-sky-400/40 bg-sky-500/15 text-sky-200",
                !done && !current && "border-white/10 text-muted",
              )}
            >
              {index + 1}. {labels[key]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
