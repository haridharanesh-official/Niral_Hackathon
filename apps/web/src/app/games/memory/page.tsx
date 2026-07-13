"use client";

import { useMemo, useState } from "react";
import { GameFrame } from "@/components/games/game-frame";

const ICONS = ["📡", "🔋", "🌡️", "📶", "💡", "🧪"];

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MemoryGamePage() {
  const deck = useMemo(
    () =>
      shuffle(
        ICONS.flatMap((icon, index) => [
          { id: `${index}-a`, icon },
          { id: `${index}-b`, icon },
        ]),
      ),
    [],
  );

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  function flip(id: string) {
    if (flipped.length === 2 || flipped.includes(id)) return;
    const card = deck.find((c) => c.id === id);
    if (!card || matched.includes(card.icon)) return;

    const next = [...flipped, id];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      const iconA = deck.find((c) => c.id === a)?.icon;
      const iconB = deck.find((c) => c.id === b)?.icon;
      if (iconA && iconA === iconB) {
        setMatched((prev) => [...prev, iconA]);
        setFlipped([]);
      } else {
        window.setTimeout(() => setFlipped([]), 650);
      }
    }
  }

  const won = matched.length === ICONS.length;

  return (
    <GameFrame
      title="Memory Game"
      subtitle="Match the sensor icons. Fewer moves = higher XP."
    >
      <p className="mb-4 font-mono text-sm text-sky-300">Moves: {moves}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {deck.map((card) => {
          const show =
            flipped.includes(card.id) || matched.includes(card.icon);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card.id)}
              className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl transition hover:border-sky-400/40"
            >
              {show ? card.icon : "?"}
            </button>
          );
        })}
      </div>
      {won ? (
        <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Cleared in {moves} moves · +35 XP (demo)
        </p>
      ) : null}
    </GameFrame>
  );
}
