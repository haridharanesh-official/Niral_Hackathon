"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useAppContent } from "@/store/content-context";

export function FeaturedTechnologiesSection() {
  const reduceMotion = useReducedMotion();
  const { content } = useAppContent();
  const technologies = content?.technologies || [];

  return (
    <section id="technologies" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Featured Hardware & Tech Stacks
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Recommended components, platforms, and protocols supported by mentors and loan kits.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {technologies.map((tech, index) => (
            <motion.a
              key={`${tech.name}-${index}`}
              href={tech.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="group glass relative flex flex-col justify-between rounded-2xl p-5 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-white group-hover:text-sky-300">
                    {tech.name}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-muted group-hover:text-sky-300" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {tech.blurb}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
