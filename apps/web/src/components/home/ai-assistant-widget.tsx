"use client";

import { AiAssistantWidget as Widget } from "@/components/landing/ai-assistant-widget";
import { trackAnalytics } from "@/hooks/use-analytics";
import { useEffect, useRef } from "react";

export function AiAssistantWidget() {
  const tracked = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!tracked.current && target?.closest("#ai-assistant")) {
        tracked.current = true;
        trackAnalytics("ai_assistant_launched");
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return <Widget />;
}
