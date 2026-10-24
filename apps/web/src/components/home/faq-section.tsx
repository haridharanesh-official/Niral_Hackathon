"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionState } from "@/components/common/section-state";
import { SectionSkeleton } from "@/components/common/section-skeleton";
import { useAsyncSection } from "@/hooks/use-async-section";
import { useAnalytics } from "@/hooks/use-analytics";
import { homeService } from "@/services/home";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const track = useAnalytics();
  const { status, data, error, reload } = useAsyncSection({
    load: () => homeService.getFaq(),
    isEmpty: (items) => items.length === 0,
  });
  const [open, setOpen] = useState<string | null>(null);

  const defaultFaqs = [
    {
      id: "f1",
      question: "Who is eligible to participate in NIRAL Hackathon 2026?",
      answer: "Undergraduate and postgraduate students, tech enthusiasts, and early-stage makers from any recognized institution across India. All participants must provide valid student or institution ID during check-in.",
    },
    {
      id: "f2",
      question: "What is the team size requirement?",
      answer: "Teams must consist of 2 to 4 members. Interdisciplinary teams (combining electronics, embedded firmware, web/mobile development, and AI) are highly encouraged.",
    },
    {
      id: "f3",
      question: "Will hardware components be provided on campus?",
      answer: "Standard prototyping components, development boards, and sensors will be available via the hardware lab inventory desk at Sri Shakthi Institute of Engineering and Technology. Teams are also welcome to bring their own specialized dev boards and actuators.",
    },
    {
      id: "f4",
      question: "How does the evaluation process work?",
      answer: "Judging occurs over multi-stage mentor reviews and a final live demonstration evaluated on Innovation, Technical Depth, Hardware Integration, Feasibility, and Presentation.",
    },
    {
      id: "f5",
      question: "Is there any registration fee?",
      answer: "Registration details and access policies are published on the portal. Stay tuned to the official announcements or reach out to iotclub.siet@gmail.com for team registration queries.",
    },
    {
      id: "f6",
      question: "Who retains ownership of the project IP?",
      answer: "The participating teams retain 100% intellectual property rights over whatever code, design, and hardware prototypes they build during the hackathon.",
    },
  ];

  const itemsToRender = (data && data.length > 0) ? data : defaultFaqs;

  return (
    <section id="faq" className="scroll-mt-24 py-16" aria-label="Frequently Asked Questions">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Got Questions?
            </span>
            <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Everything you need to know about participating in NIRAL Hackathon 2026.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {itemsToRender.map((item) => {
            const isOpen = open === item.id;
            return (
              <div
                key={item.id}
                className="rounded-[24px] border border-[var(--card-border)] bg-[var(--card)] transition hover:border-stone-400 self-start"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={() => {
                    const next = isOpen ? null : item.id;
                    setOpen(next);
                    if (next) track("faq_expanded", { id: item.id });
                  }}
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-sm font-semibold text-[var(--foreground)]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[var(--primary)] transition",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen ? (
                  <p className="border-t border-[var(--card-border)] px-6 py-4 text-xs leading-relaxed text-[var(--muted)]">
                    {item.answer}
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
