"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const themes = [
  "Industrial Automation",
  "Smart Agriculture",
  "Healthcare IoT",
  "Smart Cities",
  "Energy Management",
  "AI + IoT",
];

const seen = new Set<string>();

export function ContactNewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("Hardware");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section id="contact" className="scroll-mt-24 py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="font-display text-3xl font-bold text-white">Contact</h2>
          <p className="mt-3 text-muted">
            Questions about sponsorships, mentoring, or campus hosting?
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p>
              <span className="text-muted">Email · </span>
              <a className="text-sky-300 hover:underline" href="mailto:hello@hackos.app">
                hello@hackos.app
              </a>
            </p>
            <p>
              <span className="text-muted">Ops desk · </span>
              <span className="text-white">+1 (555) 014-2026</span>
            </p>
            <p>
              <span className="text-muted">Venue · </span>
              <span className="text-white">Hybrid — Campus Innovation Hall + Online</span>
            </p>
          </div>
        </div>

        <div
          id="newsletter"
          className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-violet-500/10 p-8"
        >
          <h2 className="font-display text-3xl font-bold text-white">Newsletter</h2>
          <p className="mt-3 text-muted">
            Challenge teasers, mentor schedules, and prize updates.
          </p>
          <form
            className="mt-6 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              setStatus(null);
              if (!consent) {
                setError("Please accept consent to subscribe.");
                return;
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError("Enter a valid email address.");
                return;
              }
              const key = email.trim().toLowerCase();
              if (seen.has(key)) {
                setError("This email is already subscribed.");
                return;
              }
              seen.add(key);
              setStatus(
                `Confirmation queued for ${email}. Welcome, ${name || "hacker"}!`,
              );
              setName("");
              setEmail("");
              setConsent(false);
            }}
          >
            <input
              className="field-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              className="field-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              className="field-input"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              aria-label="Interests"
            >
              <option>Hardware</option>
              <option>AI / ML</option>
              <option>Cloud</option>
              <option>Product</option>
              <option>Sponsorship</option>
            </select>
            <select
              className="field-input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Preferred theme"
            >
              {themes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I consent to receive HackOS updates and understand I can unsubscribe anytime.
            </label>
            <Button type="submit" className="cta-primary w-full sm:w-auto">
              Subscribe
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-orange-300">{error}</p> : null}
          {status ? <p className="mt-3 text-sm text-emerald-300">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
