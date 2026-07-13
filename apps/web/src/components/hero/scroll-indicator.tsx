"use client";

import { Mouse } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollIndicator({ scrolled }: { scrolled: boolean }) {
  return (
    <a
      href="#about"
      className={cn(
        "absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-sky-300/80 transition-opacity duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        scrolled ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      aria-label="Scroll to about section"
    >
      <Mouse
        className="h-5 w-5 animate-bounce motion-reduce:animate-none"
        aria-hidden
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
        Scroll
      </span>
    </a>
  );
}
