"use client";

import Link from "next/link";
import { Trophy, Award, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WinnersSection() {
  return (
    <section id="winners" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              Recognition & Excellence
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Hall of Champions
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Grand champions, runner-ups, and innovation track winners of NIRAL Hackathon 2026.
            </p>
          </div>
          <Link href="/register">
            <Button size="md" className="cta-primary whitespace-nowrap">
              <Trophy className="mr-2 h-4 w-4" />
              Compete for Honors
            </Button>
          </Link>
        </div>

        <div className="mt-10 rounded-3xl border border-amber-400/20 bg-amber-500/[0.03] p-8 sm:p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold text-white sm:text-2xl">
            Awaiting the Champions of NIRAL 2026
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            The prestigious Grand Finale takes place on December 4, 2026. Top qualifying teams will pitch to our industry jury, and official winners, prototypes, and code repositories will be permanently celebrated here.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="#themes">
              <Button variant="secondary" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Explore Competition Tracks
              </Button>
            </Link>
            <Link href="#timeline">
              <Button variant="ghost" size="sm" className="text-amber-300 hover:text-white">
                View Event Timeline <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
