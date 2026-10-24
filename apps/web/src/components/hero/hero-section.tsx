"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CountdownTimer } from "@/components/landing/countdown-timer";
import { AnimatedBackground } from "@/components/hero/animated-background";
import { HeroSubtitle, HeroTitle } from "@/components/hero/hero-copy";
import { CTAButtons } from "@/components/hero/cta-buttons";
import { StatisticsCards } from "@/components/hero/statistics-cards";
import { ScrollIndicator } from "@/components/hero/scroll-indicator";
import { SectionState } from "@/components/common/section-state";
import { useAsyncSection } from "@/hooks/use-async-section";
import { homeService } from "@/services/home";

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const [isLive, setIsLive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const eventQuery = useAsyncSection({
    load: () => homeService.getEvent(),
  });
  const statsQuery = useAsyncSection({
    load: () => homeService.getStatistics(),
  });

  const onLiveChange = useCallback((live: boolean) => setIsLive(live), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <AnimatedBackground parallax={parallax} reduceMotion={reduceMotion} />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-6 pb-24 pt-10">
        <SectionState
          status={eventQuery.status === "loading" ? "loading" : eventQuery.status}
          error={eventQuery.error}
          onRetry={eventQuery.reload}
          skeleton={
            <div className="space-y-4" aria-busy="true">
              <div className="h-12 w-64 animate-pulse rounded-xl bg-white/10" />
              <div className="h-16 w-full max-w-xl animate-pulse rounded-xl bg-white/5" />
            </div>
          }
        >
          <HeroTitle
            title={eventQuery.data?.tagline ?? "The Future of Innovation Starts Here"}
            isLive={isLive}
          />
          <HeroSubtitle />
          <CountdownTimer
            onLiveChange={onLiveChange}
            targetMs={
              eventQuery.data
                ? new Date(eventQuery.data.startsAt).getTime()
                : undefined
            }
          />
          <CTAButtons isLive={isLive} />
        </SectionState>
      </div>

      <ScrollIndicator scrolled={scrolled} />
    </section>
  );
}
