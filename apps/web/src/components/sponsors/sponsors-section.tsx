"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionState } from "@/components/common/section-state";
import { SectionSkeleton } from "@/components/common/section-skeleton";
import { useAsyncSection } from "@/hooks/use-async-section";
import { trackAnalytics } from "@/hooks/use-analytics";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

export function SponsorsSection() {
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getSponsors(),
    isEmpty: (items) => items.length === 0,
  });
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sponsors = data ?? [];
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
      </div>

      <div className="mt-10 px-6">
        <SectionState
          status={status}
          error={error}
          onRetry={reload}
          emptyMessage="Official partners and sponsors for NIRAL 2026 are currently being finalized and will be announced soon."
          skeleton={<SectionSkeleton cards={4} />}
        >
          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => {
              setPaused(false);
              setExpanded(null);
            }}
          >
            <div
              className={cn(
                "flex w-max gap-4",
                paused
                  ? "[animation-play-state:paused]"
                  : "animate-marquee-slow motion-reduce:animate-none",
              )}
            >
              {loop.map((sponsor, index) => {
                const key = `${sponsor.id}-${index}`;
                const isOpen = expanded === key;
                return (
                  <article
                    key={key}
                    className={cn(
                      "w-72 shrink-0 rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition duration-300",
                      isOpen &&
                        "border-sky-400/40 bg-sky-500/[0.07] shadow-[0_0_30px_rgba(56,189,248,0.2)]",
                    )}
                    onMouseEnter={() => setExpanded(key)}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200">
                      {sponsor.category}
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
                          target={sponsor.website.startsWith("http") ? "_blank" : undefined}
                          rel={
                            sponsor.website.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="inline-flex"
                          onClick={() =>
                            trackAnalytics("sponsor_clicked", {
                              id: sponsor.id,
                              name: sponsor.name,
                            })
                          }
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
        </SectionState>
      </div>
    </section>
  );
}
