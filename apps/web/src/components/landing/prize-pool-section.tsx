"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const prizes = [
  {
    place: "1st Place",
    amount: "₹1,50,000",
    perks: ["Trophy + certificates", "Internship fast-track", "Hardware kit"],
    icon: Crown,
    highlight: true,
  },
  {
    place: "2nd Place",
    amount: "₹90,000",
    perks: ["Certificates", "Cloud credits", "Mentor clinic"],
    icon: Trophy,
    highlight: false,
  },
  {
    place: "3rd Place",
    amount: "₹60,000",
    perks: ["Certificates", "Swag pack", "Workshop access"],
    icon: Medal,
    highlight: false,
  },
];

export function PrizePoolSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="prizes" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Prize Pool
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              ₹3,00,000 total across track winners, special mentions, and sponsor
              awards.
            </p>
          </div>
          <Link href="/register">
            <Button className="cta-primary">Register to compete</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {prizes.map((prize, index) => (
            <motion.article
              key={prize.place}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={
                prize.highlight
                  ? "glow-ring rounded-3xl border border-sky-400/30 bg-gradient-to-br from-sky-500/15 to-violet-500/10 p-6"
                  : "glass rounded-3xl p-6"
              }
            >
              <prize.icon
                className={
                  prize.highlight
                    ? "h-6 w-6 text-sky-300"
                    : "h-6 w-6 text-violet-300"
                }
                aria-hidden
              />
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {prize.place}
              </p>
              <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-white">
                {prize.amount}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {prize.perks.map((perk) => (
                  <li key={perk}>· {perk}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
