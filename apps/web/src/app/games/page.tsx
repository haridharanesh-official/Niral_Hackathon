import Link from "next/link";
import {
  CircuitBoard,
  Crosshair,
  Dice5,
  Gamepad2,
  Grid3X3,
  KeyRound,
  MemoryStick,
  Puzzle,
  Radar,
  Sparkles,
  Gem,
  Bug,
} from "lucide-react";

const games = [
  {
    href: "/games/circuit-builder",
    title: "Circuit Builder",
    blurb: "Wire a working path before the clock burns out.",
    icon: CircuitBoard,
  },
  {
    href: "/games/memory",
    title: "Memory Game",
    blurb: "Match sensor icons and bank XP.",
    icon: MemoryStick,
  },
  {
    href: "/games/guess-sensor",
    title: "Guess the Sensor",
    blurb: "Identify components from cryptic clues.",
    icon: Radar,
  },
  {
    href: "/games/debug",
    title: "Debug Challenge",
    blurb: "Find the faulty line in embedded snippets.",
    icon: Bug,
  },
  {
    href: "/games/spin-wheel",
    title: "Spin Wheel",
    blurb: "Daily XP lottery with streak multipliers.",
    icon: Dice5,
  },
  {
    href: "/games/puzzle",
    title: "Puzzle Challenge",
    blurb: "Slide tiles to reconstruct a PCB silkscreen.",
    icon: Puzzle,
  },
  {
    href: "/games/crossword",
    title: "Crossword",
    blurb: "IoT vocabulary across the board.",
    icon: Grid3X3,
  },
  {
    href: "/games/escape-room",
    title: "Escape Room",
    blurb: "Unlock the lab with sequential cipher keys.",
    icon: KeyRound,
  },
  {
    href: "/games/hardware-hunt",
    title: "Hardware Hunt",
    blurb: "Locate hidden components across a virtual floorplan.",
    icon: Crosshair,
  },
  {
    href: "/games/treasure",
    title: "Hidden Treasure Hunt",
    blurb: "Follow packet breadcrumbs to the prize cache.",
    icon: Gem,
  },
  {
    href: "/games/daily",
    title: "Daily Challenge",
    blurb: "One fresh challenge every 24 hours.",
    icon: Sparkles,
  },
  {
    href: "/games/weekly",
    title: "Weekly Challenge",
    blurb: "Harder multi-stage boss fight for elite XP.",
    icon: Gamepad2,
  },
];

export default function GamesPage() {
  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
              Mini Games
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              Play. Learn. Rank.
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="glass rounded-3xl p-5 transition hover:border-sky-400/30"
            >
              <game.icon className="h-6 w-6 text-sky-300" />
              <h2 className="mt-4 font-display text-lg font-semibold text-white">
                {game.title}
              </h2>
              <p className="mt-2 text-sm text-muted">{game.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
