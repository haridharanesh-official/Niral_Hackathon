"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Banknote,
  Briefcase,
  Network,
  Rocket,
  UserRound,
} from "lucide-react";

const reasons = [
  {
    icon: Rocket,
    title: "Build Real Products",
    blurb:
      "Develop solutions addressing real-world challenges using cutting-edge technologies.",
  },
  {
    icon: UserRound,
    title: "Industry Mentorship",
    blurb:
      "Receive one-on-one guidance from experienced engineers, researchers, and entrepreneurs.",
  },
  {
    icon: Network,
    title: "Networking",
    blurb:
      "Collaborate with peers, industry experts, startups, and sponsors.",
  },
  {
    icon: Briefcase,
    title: "Internships",
    blurb:
      "Outstanding participants gain opportunities for internships and recruitment.",
  },
  {
    icon: Banknote,
    title: "Cash Prizes",
    blurb:
      "Compete for substantial prize money and exclusive sponsor rewards.",
  },
  {
    icon: Award,
    title: "Certificates",
    blurb:
      "Receive digitally verifiable participation and achievement certificates.",
  },
];

export function WhyParticipateSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="why" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Why Participate
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Tangible benefits that turn a weekend into career momentum.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((item, index) => (
            <motion.article
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group benefit-card rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-sky-400/50 hover:shadow-[0_12px_40px_rgba(56,189,248,0.18)] motion-reduce:transform-none"
            >
              <item.icon
                className="h-6 w-6 text-cyan-300 transition duration-300 group-hover:rotate-[10deg] motion-reduce:transition-none"
                aria-hidden
              />
              <h3 className="mt-4 font-display text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.blurb}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
