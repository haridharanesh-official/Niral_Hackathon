"use client";

import Link from "next/link";
import { Handshake, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SponsorsSection() {
  return (
    <section id="sponsors" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-sky-400">
              Partnerships & Support
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Sponsors & Partners
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Official corporate, technology, and community sponsorships for NIRAL 2026 are currently being finalized.
            </p>
          </div>
          <Link href="/dashboard/sponsor">
            <Button size="md" className="cta-primary whitespace-nowrap">
              <Handshake className="mr-2 h-4 w-4" />
              Become a Sponsor
            </Button>
          </Link>
        </div>

        <div className="mt-10 rounded-3xl border border-sky-400/20 bg-sky-500/[0.03] p-8 sm:p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300">
            <Handshake className="h-7 w-7" />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold text-white sm:text-2xl">
            Official Partners Announcing Soon
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            We are collaborating with leading technology providers, hardware manufacturers, and academic bodies to empower our participants with kits, APIs, and cloud infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="#contact">
              <Button variant="secondary" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Contact Sponsorship Desk
              </Button>
            </Link>
            <Link href="/dashboard/sponsor">
              <Button variant="ghost" size="sm" className="text-sky-300 hover:text-white">
                View Sponsorship Brochure <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
