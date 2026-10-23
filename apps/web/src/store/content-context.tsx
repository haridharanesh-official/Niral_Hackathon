"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppContentData } from "@/lib/content-store";
import { initialDefaultContent } from "@/lib/content-store";

interface ContentContextType {
  content: AppContentData;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateContent: (newContent: Partial<AppContentData>) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<AppContentData>(initialDefaultContent);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (e) {
      console.error("Failed to load dynamic content", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Listen to cross-tab / storage updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "hackos_content_sync") {
        refresh();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  const updateContent = async (partial: Partial<AppContentData>) => {
    try {
      // Optimistic state update
      setContent((prev) => ({ ...prev, ...partial }));
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setContent(result.data);
          // Broadcast to other tabs/windows
          localStorage.setItem("hackos_content_sync", Date.now().toString());
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating content", e);
      return false;
    }
  };

  const resetToDefault = async () => {
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setContent(result.data);
          localStorage.setItem("hackos_content_sync", Date.now().toString());
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error resetting content", e);
      return false;
    }
  };

  return (
    <ContentContext.Provider
      value={{
        content,
        isLoading,
        refresh,
        updateContent,
        resetToDefault,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useAppContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useAppContent must be used within a ContentProvider");
  }
  return ctx;
}
