"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameFrame } from "@/components/games/game-frame";

const PRIZES = [5, 10, 15, 20, 35, 50, 8, 12];

export default function SpinWheelPage() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  function spin() {
    setSpinning(true);
    setResult(null);
    window.setTimeout(() => {
      const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      setResult(prize);
      setSpinning(false);
    }, 1200);
  }

  return (
    <GameFrame title="Spin Wheel" subtitle="Daily XP lottery — one intentional spin.">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-sky-400/40 bg-gradient-to-br from-sky-500/20 to-violet-500/20 font-display text-2xl text-white">
          {spinning ? "..." : result ? `+${result}` : "SPIN"}
        </div>
        <Button onClick={spin} disabled={spinning || result !== null}>
          {result !== null ? "Already spun" : spinning ? "Spinning..." : "Spin now"}
        </Button>
      </div>
    </GameFrame>
  );
}
