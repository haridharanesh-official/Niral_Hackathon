"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Who can participate?",
    a: "Students, early-career engineers, and makers with interest in IoT, AI, embedded, or cybersecurity.",
  },
  {
    q: "What is the team size?",
    a: "Teams of 2–4. Solo builders can join the matching lobby after registration.",
  },
  {
    q: "Is hardware provided?",
    a: "Yes. Organizers distribute kits via the volunteer desk. Bring your laptop and chargers.",
  },
  {
    q: "How does judging work?",
    a: "Live scorecards across innovation, technical complexity, presentation, scalability, impact, UI, and business value.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">FAQ</h2>
        <p className="mt-3 text-muted">Answers before you boot the weekend.</p>

        <div className="mt-8 space-y-3">
          {faqs.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-sky-300 transition",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen ? (
                  <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-muted">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
