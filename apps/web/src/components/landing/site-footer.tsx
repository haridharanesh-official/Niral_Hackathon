"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { useAppContent } from "@/store/content-context";

export function SiteFooter() {
  const { content } = useAppContent();
  const appName = content?.event?.name || "NIRAL Hackathon 2026";
  const initial = appName.charAt(0) || "N";

  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--card)] py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white shadow-sm">
              {initial}
            </div>
            <div>
              <p className="font-sans text-lg font-bold text-[var(--foreground)]">
                {appName}
              </p>
              <p className="text-xs text-[var(--muted)]">
                December 3–4, 2026 · Sri Shakthi Institute of Engineering and Technology
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies hackathon bringing together students, makers, and innovators to build real-world solutions.
          </p>
        </div>

        {/* Contact Snippet */}
        <div className="space-y-2 text-xs text-[var(--muted)]">
          <p className="font-semibold uppercase tracking-wider text-[var(--foreground)]">
            Contact & Venue
          </p>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[var(--primary)]" />
            <a href="mailto:iotclub.siet@gmail.com" className="hover:text-[var(--foreground)] transition">
              iotclub.siet@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[var(--primary)]" />
            <a href="tel:8508511975" className="hover:text-[var(--foreground)] transition">
              8508511975
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span>Sri Shakthi Institute of Engineering and Technology</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 text-xs font-medium text-[var(--muted)]">
          <p className="font-semibold uppercase tracking-wider text-[var(--foreground)]">
            Navigation
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <a href="#about" className="hover:text-[var(--foreground)] transition">
              About
            </a>
            <a href="#tracks" className="hover:text-[var(--foreground)] transition">
              Tracks
            </a>
            <a href="#problems" className="hover:text-[var(--foreground)] transition">
              Problems
            </a>
            <a href="#timeline" className="hover:text-[var(--foreground)] transition">
              Timeline
            </a>
            <a href="#rules" className="hover:text-[var(--foreground)] transition">
              Rules
            </a>
            <a href="#faq" className="hover:text-[var(--foreground)] transition">
              FAQ
            </a>
            <a href="#contact" className="hover:text-[var(--foreground)] transition">
              Contact
            </a>
            <Link href="/login" className="hover:text-[var(--foreground)] transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1400px] border-t border-[var(--card-border)]/60 px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--muted)] gap-3">
        <p>© 2026 NIRAL Hackathon. Sri Shakthi Institute of Engineering and Technology. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
            Register Now
          </Link>
          <Link href="/login" className="hover:text-[var(--foreground)] transition">
            Participant Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
