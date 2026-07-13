"use client";

import { Button } from "@/components/ui/button";
import type { SectionStatus } from "@/types/home";

type SectionStateProps = {
  status: SectionStatus;
  error?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionState({
  status,
  error,
  emptyMessage = "Nothing to show here yet.",
  onRetry,
  skeleton,
  children,
}: SectionStateProps) {
  if (status === "loading") {
    return (
      skeleton ?? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      )
    );
  }

  if (status === "error") {
    return (
      <div
        className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-6"
        role="alert"
      >
        <p className="font-display text-lg text-white">
          We couldn&apos;t load this section. Please try again.
        </p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        {onRetry ? (
          <Button className="mt-4" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
