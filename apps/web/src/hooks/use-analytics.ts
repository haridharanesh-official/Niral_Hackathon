"use client";

import { useCallback } from "react";
import type { AnalyticsEvent, AnalyticsEventName } from "@/types/home";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackAnalytics(
  name: AnalyticsEventName,
  props?: AnalyticsEvent["props"],
) {
  if (typeof window === "undefined") return;

  const payload = {
    event: name,
    ...props,
    at: new Date().toISOString(),
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", payload);
  }
}

export function useAnalytics() {
  return useCallback(
    (name: AnalyticsEventName, props?: AnalyticsEvent["props"]) => {
      trackAnalytics(name, props);
    },
    [],
  );
}
