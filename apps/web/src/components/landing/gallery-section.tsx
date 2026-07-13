"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Download,
  Heart,
  Share2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  title: string;
  type: string;
  theme: string;
  college: string;
  tech: string;
  award: string;
  year: string;
  tone: string;
};

const items: Item[] = [
  { title: "Hardware Lab", type: "Photos", theme: "Industrial IoT", college: "NIT", tech: "ESP32", award: "Winner", year: "2025", tone: "from-sky-500/30 to-cyan-500/5" },
  { title: "Pitch Arena", type: "Videos", theme: "AI + IoT", college: "State Tech", tech: "Python", award: "Runner-up", year: "2025", tone: "from-violet-500/30 to-fuchsia-500/5" },
  { title: "PCB Close-up", type: "PCB Images", theme: "Healthcare", college: "Metro Eng", tech: "STM32", award: "Track", year: "2024", tone: "from-emerald-500/25 to-teal-500/5" },
  { title: "CAD Housing", type: "CAD Models", theme: "Agriculture", college: "NIT", tech: "LoRa", award: "Special", year: "2024", tone: "from-amber-500/20 to-orange-500/5" },
  { title: "Circuit Diagram", type: "Circuit Designs", theme: "Energy", college: "State Tech", tech: "MQTT", award: "—", year: "2025", tone: "from-blue-500/25 to-indigo-500/5" },
  { title: "Finals Deck", type: "Presentations", theme: "Smart Cities", college: "Metro Eng", tech: "OpenCV", award: "Third", year: "2023", tone: "from-rose-500/20 to-pink-500/5" },
  { title: "Research Note", type: "Research Papers", theme: "Cybersecurity", college: "NIT", tech: "Arduino", award: "Paper", year: "2023", tone: "from-cyan-500/20 to-sky-700/10" },
  { title: "Prototype Rig", type: "Photos", theme: "Industrial IoT", college: "State Tech", tech: "Raspberry Pi", award: "Winner", year: "2024", tone: "from-violet-500/20 to-sky-500/10" },
];

const filters = {
  Theme: ["All", "Industrial IoT", "AI + IoT", "Healthcare", "Agriculture", "Energy", "Smart Cities", "Cybersecurity"],
  College: ["All", "NIT", "State Tech", "Metro Eng"],
  Technology: ["All", "ESP32", "Python", "STM32", "LoRa", "MQTT", "OpenCV", "Arduino", "Raspberry Pi"],
  Award: ["All", "Winner", "Runner-up", "Third", "Track", "Special", "Paper", "—"],
  Year: ["All", "2025", "2024", "2023"],
  Type: ["All", "Photos", "Videos", "Circuit Designs", "PCB Images", "CAD Models", "Presentations", "Research Papers"],
} as const;

export function GallerySection() {
  const [theme, setTheme] = useState("All");
  const [college, setCollege] = useState("All");
  const [tech, setTech] = useState("All");
  const [award, setAward] = useState("All");
  const [year, setYear] = useState("All");
  const [type, setType] = useState("All");
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (theme === "All" || i.theme === theme) &&
          (college === "All" || i.college === college) &&
          (tech === "All" || i.tech === tech) &&
          (award === "All" || i.award === award) &&
          (year === "All" || i.year === year) &&
          (type === "All" || i.type === type),
      ),
    [theme, college, tech, award, year, type],
  );

  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight")
        setViewer((v) => (v === null ? v : (v + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setViewer((v) =>
          v === null ? v : (v - 1 + filtered.length) % filtered.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, filtered.length]);

  const active = viewer !== null ? filtered[viewer] : null;

  return (
    <section id="gallery" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Innovation Gallery
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Photos, circuits, CAD, papers — filter and open fullscreen.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Theme", theme, setTheme, filters.Theme],
              ["College", college, setCollege, filters.College],
              ["Technology", tech, setTech, filters.Technology],
              ["Award", award, setAward, filters.Award],
              ["Year", year, setYear, filters.Year],
              ["Type", type, setType, filters.Type],
            ] as const
          ).map(([label, value, setter, options]) => (
            <label key={label} className="text-xs text-muted">
              {label}
              <select
                className="field-input mt-1"
                value={value}
                onChange={(e) => setter(e.target.value)}
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((shot, index) => (
            <button
              key={`${shot.title}-${shot.year}`}
              type="button"
              className={`group relative flex h-44 items-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${shot.tone} p-5 text-left transition hover:border-sky-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => setViewer(index)}
            >
              <div className="absolute inset-0 scale-100 bg-black/0 transition duration-500 group-hover:scale-110 group-hover:bg-black/20" />
              <div className="relative z-10">
                <span className="font-display text-lg font-semibold text-white">
                  {shot.title}
                </span>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 opacity-0 transition group-hover:opacity-100">
                  {shot.type} · {shot.theme} · {shot.year}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setViewer(null)}
        >
          <div
            className="glass w-full max-w-3xl rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {active.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {active.type} · {active.college} · {active.tech} · {active.award}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-white/5"
                aria-label="Close viewer"
                onClick={() => setViewer(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className={cn(
                "mt-4 h-64 rounded-2xl bg-gradient-to-br sm:h-80",
                active.tone,
              )}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Action
                icon={Heart}
                label={liked[active.title] ? "Liked" : "Like"}
                onClick={() =>
                  setLiked((s) => ({ ...s, [active.title]: !s[active.title] }))
                }
              />
              <Action
                icon={Bookmark}
                label={bookmarked[active.title] ? "Saved" : "Bookmark"}
                onClick={() =>
                  setBookmarked((s) => ({
                    ...s,
                    [active.title]: !s[active.title],
                  }))
                }
              />
              <Action
                icon={Share2}
                label="Share"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    `${active.title} — HackOS Gallery`,
                  )
                }
              />
              <Action icon={Download} label="Download" onClick={() => undefined} />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              ← → keyboard · Esc close
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-sky-200 hover:border-sky-400/30"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
