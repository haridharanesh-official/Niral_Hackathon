"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { homeService } from "@/services/home";
import { trackAnalytics } from "@/hooks/use-analytics";

const themes = [
  "Industrial Automation",
  "Smart Agriculture",
  "Healthcare IoT",
  "Smart Cities",
  "Energy Management",
  "AI + IoT",
];

export function ContactNewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("Hardware");
  const [theme, setTheme] = useState(themes[0] ?? "");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section id="contact" className="scroll-mt-24 py-16">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--card)] p-8 sm:p-10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Get in Touch
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Contact & Organizing Desk
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Reach out to the NIRAL Hackathon 2026 organizing committee at IoT Club, Sri Shakthi Institute of Engineering and Technology for registrations, mentorship, hardware lab inquiries, or sponsorships.
            </p>
            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-subtle)] p-4">
                <span className="text-[var(--muted)] block text-xs font-semibold uppercase tracking-wider">
                  Official Email
                </span>
                <a className="mt-1 text-[var(--primary)] font-semibold hover:underline text-base inline-block" href="mailto:iotclub.siet@gmail.com">
                  iotclub.siet@gmail.com
                </a>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-subtle)] p-4">
                <span className="text-[var(--muted)] block text-xs font-semibold uppercase tracking-wider">
                  Helpline / Phone
                </span>
                <a className="mt-1 text-[var(--foreground)] font-semibold hover:underline text-base inline-block" href="tel:8508511975">
                  8508511975
                </a>
              </div>
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-subtle)] p-4">
                <span className="text-[var(--muted)] block text-xs font-semibold uppercase tracking-wider">
                  Venue & Host Institution
                </span>
                <span className="mt-1 text-[var(--foreground)] font-semibold text-base block">
                  Sri Shakthi Institute of Engineering and Technology
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          id="newsletter"
          className="rounded-[28px] border border-[var(--primary)]/30 bg-[var(--card)] p-8 sm:p-10 shadow-sm"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            Stay Connected
          </span>
          <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Hackathon Updates & Bulletin
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Subscribe for track problem statement drops, hardware kit manifests, and mentor scheduling announcements.
          </p>
          <form
            className="mt-6 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setStatus(null);
              setPending(true);
              try {
                const res = await homeService.subscribeNewsletter({
                  name,
                  email,
                  interest,
                  theme,
                  consent,
                });
                setStatus(res.message);
                trackAnalytics("newsletter_subscribed", { theme, interest });
                setName("");
                setEmail("");
                setConsent(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Subscribe failed");
              } finally {
                setPending(false);
              }
            }}
          >
            <input
              className="field-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
            <input
              type="email"
              className="field-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
            />
            <select
              className="field-input"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              aria-label="Interests"
              disabled={pending}
            >
              <option>Hardware & Sensors</option>
              <option>AI / ML & Edge</option>
              <option>Cloud & Backend</option>
              <option>Embedded & IoT Systems</option>
              <option>Cybersecurity</option>
            </select>
            <select
              className="field-input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Preferred theme"
              disabled={pending}
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
                disabled={pending}
              />
              I consent to receive Niral Hackathon updates and understand I can unsubscribe anytime.
            </label>
            <Button
              type="submit"
              className="cta-primary w-full sm:w-auto"
              disabled={pending}
            >
              {pending ? "Submitting…" : "Subscribe"}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-orange-300">{error}</p> : null}
          {status ? <p className="mt-3 text-sm text-emerald-300">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
