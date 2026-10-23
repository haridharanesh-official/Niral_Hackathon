"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAppContent } from "@/store/content-context";

export function EmergencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { content } = useAppContent();

  const emergency = content?.emergencyBanner;
  if (!emergency?.enabled || !emergency?.message || dismissed) return null;

  return (
    <div
      className="sticky top-0 z-50 border-b border-red-500/40 bg-red-600/90 text-white backdrop-blur-md transition-all duration-300"
      role="alert"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p className="flex-1 text-sm font-medium leading-relaxed">
          {emergency.message}
        </p>
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Dismiss emergency banner"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
