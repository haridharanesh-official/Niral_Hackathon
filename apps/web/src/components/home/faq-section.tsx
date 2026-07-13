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

  return (
    <section id="faq" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">FAQ</h2>
        <p className="mt-3 text-muted">Answers before you boot the weekend.</p>

        <div className="mt-8">
          <SectionState
            status={status}
            error={error}
            onRetry={reload}
            emptyMessage="No FAQs available."
            skeleton={<SectionSkeleton cards={3} className="grid-cols-1" />}
          >
            <div className="space-y-3">
              {(data ?? []).map((item) => {
                const isOpen = open === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      onClick={() => {
                        const next = isOpen ? null : item.id;
                        setOpen(next);
                        if (next) track("faq_expanded", { id: item.id });
                      }}
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium text-white">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-sky-300 transition",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-muted">
                        {item.answer}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </SectionState>
        </div>
      </div>
    </section>
  );
}
