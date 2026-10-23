"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContent } from "@/store/content-context";

const icons = [Crown, Trophy, Medal];

export function PrizePoolSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const prizes = content?.prizes || [];
  const event = content?.event;
  const hasConfirmedPrize = Boolean(event?.prizePool && event.prizePool > 0);
  const totalPrizeFormatted = hasConfirmedPrize
    ? `₹${event!.prizePool.toLocaleString("en-IN")}`
    : "To be announced";

  return (
    <section id="prizes" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Prize Pool & Awards
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {hasConfirmedPrize
                ? `${totalPrizeFormatted} total across track winners, prototype manufacturing grants, and sponsor awards.`
                : "Official prize pool distribution, hardware grants, and category bounties will be announced soon."}
            </p>
          </div>
          <Link href="/register">
            <Button size="md" className="cta-primary">
              Register interest
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {prizes.map((prize, index) => {
            const Icon = icons[index % icons.length] || Trophy;
            return (
              <motion.article
                key={prize.place}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className={`flex flex-col justify-between rounded-[28px] border bg-[var(--card)] p-6 shadow-sm transition hover:shadow-md ${
                  prize.highlight
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-md"
                    : "border-[var(--card-border)]"
                }`}
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF0EB] dark:bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {prize.place}
                  </p>
                  <p className="mt-1 font-sans text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
                    {prize.amount}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                    {prize.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-[var(--primary)] font-bold">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
