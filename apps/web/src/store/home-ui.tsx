"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HomeUiState = {
  dark: boolean;
  lang: "EN" | "HI";
  setDark: (value: boolean) => void;
  toggleDark: () => void;
  setLang: (value: "EN" | "HI") => void;
  toggleLang: () => void;
};

const HomeUiContext = createContext<HomeUiState | null>(null);

export function HomeUiProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  const setDark = useCallback((value: boolean) => {
    setDarkState(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }, []);

  const toggleDark = useCallback(() => {
    setDarkState((v) => {
      const next = !v;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((v) => (v === "EN" ? "HI" : "EN"));
  }, []);

  const value = useMemo(
    () => ({ dark, lang, setDark, toggleDark, setLang, toggleLang }),
    [dark, lang, setDark, toggleDark, toggleLang],
  );

  return (
    <HomeUiContext.Provider value={value}>{children}</HomeUiContext.Provider>
  );
}

export function useHomeUi() {
  const ctx = useContext(HomeUiContext);
  if (!ctx) {
    throw new Error("useHomeUi must be used within HomeUiProvider");
  }
  return ctx;
}
