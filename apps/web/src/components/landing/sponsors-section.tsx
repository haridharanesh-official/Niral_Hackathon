"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Sponsor = {
  name: string;
  description: string;
  careers: string;
  challenges: string;
  website: string;
  tier: "Platinum" | "Gold" | "Silver" | "Community" | "Technology";
};

const sponsors: Sponsor[] = [
  {
    name: "NVIDIA Jetson",
    description: "Edge AI compute for vision and robotics tracks.",
    careers: "Internships in embedded AI",
    challenges: "Edge Vision Challenge",
    website: "https://developer.nvidia.com/embedded-computing",
    tier: "Platinum",
  },
  {
    name: "Arduino",
    description: "Prototyping hardware and education kits.",
    careers: "Maker educator roles",
    challenges: "Rapid Prototype Award",
    website: "https://www.arduino.cc/",
    tier: "Platinum",
  },
  {
    name: "Espressif",
    description: "ESP32 platforms for connected devices.",
    careers: "Firmware engineering",
    challenges: "Connectivity Challenge",
    website: "https://www.espressif.com/",
    tier: "Gold",
  },
  {
    name: "STMicroelectronics",
    description: "STM32 MCUs for industrial and robotics builds.",
    careers: "Embedded systems roles",
    challenges: "Industrial Automation Track",
    website: "https://www.st.com/",
    tier: "Gold",
  },
  {
    name: "GitHub",
    description: "Repos, CI, and collaboration for every team.",
    careers: "Student developer pack",
    challenges: "Open Source Excellence",
    website: "https://github.com/",
    tier: "Silver",
  },
  {
    name: "Vercel",
    description: "Frontend and edge hosting for dashboards.",
    careers: "Web platform roles",
    challenges: "Best Ops Console",
    website: "https://vercel.com/",
    tier: "Silver",
  },
  {
    name: "Edge Impulse",
    description: "TinyML tooling for on-device intelligence.",
    careers: "ML engineer pathways",
    challenges: "TinyML Spotlight",
    website: "https://www.edgeimpulse.com/",
    tier: "Technology",
  },
  {
    name: "Hailo",
    description: "AI accelerators for real-time edge vision.",
    careers: "Vision systems roles",
    challenges: "Accelerated Inference Award",
    website: "https://hailo.ai/",
    tier: "Technology",
  },
  {
    name: "IoT Lab Community",
    description: "Campus makers supporting hardware desks.",
    careers: "Volunteer leadership",
    challenges: "Community Impact Badge",
    website: "#contact",
    tier: "Community",
  },
];

const tiers: Sponsor["tier"][] = [
  "Platinum",
  "Gold",
  "Silver",
  "Technology",
  "Community",
];

export function SponsorsSection() {
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const loop = [...sponsors, ...sponsors];

  return (
    <section id="sponsors" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Sponsor Showcase
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Platinum to community partners — hover to pause and expand details.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tiers.map((tier) => (
            <span
              key={tier}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted"
            >
              {tier === "Community" || tier === "Technology"
                ? `${tier} Partners`
                : `${tier} Sponsors`}
            </span>
          ))}
        </div>
      </div>

      <div
        className="relative mt-10 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setExpanded(null);
        }}
      >
        <div
          className={cn(
            "flex w-max gap-4 px-6",
            paused
              ? "[animation-play-state:paused]"
              : "animate-marquee-slow motion-reduce:animate-none",
          )}
        >
          {loop.map((sponsor, index) => {
            const isOpen = expanded === `${sponsor.name}-${index}`;
            return (
              <article
                key={`${sponsor.name}-${index}`}
                className={cn(
                  "w-72 shrink-0 rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition duration-300",
                  isOpen &&
                    "border-sky-400/40 bg-sky-500/[0.07] shadow-[0_0_30px_rgba(56,189,248,0.2)]",
                )}
                onMouseEnter={() => setExpanded(`${sponsor.name}-${index}`)}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200">
                  {sponsor.tier}
                </p>
                <div className="mt-3 flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-violet-500/10 font-display text-sm tracking-wide text-sky-100">
                  {sponsor.name}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-white">
                  {sponsor.name}
                </h3>
                <p className="mt-2 text-sm text-muted">{sponsor.description}</p>

                {isOpen ? (
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-muted">
                    <p>
                      <span className="text-sky-300">Careers · </span>
                      {sponsor.careers}
                    </p>
                    <p>
                      <span className="text-sky-300">Challenge · </span>
                      {sponsor.challenges}
                    </p>
                    <a
                      href={sponsor.website}
                      target={
                        sponsor.website.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        sponsor.website.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="inline-flex"
                    >
                      <Button size="sm" variant="secondary" className="mt-2">
                        Visit website
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </a>
                  </div>
                ) : (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-sky-300/70">
                    Hover for details
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
