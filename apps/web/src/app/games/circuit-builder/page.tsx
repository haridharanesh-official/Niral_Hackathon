"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameFrame } from "@/components/games/game-frame";

const NODES = ["PWR", "MCU", "SENSOR", "RADIO", "CLOUD"];
const SOLUTION = ["PWR", "MCU", "SENSOR", "RADIO", "CLOUD"];

export default function CircuitBuilderPage() {
  const [path, setPath] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  function add(node: string) {
    if (path.includes(node)) return;
    const next = [...path, node];
    setPath(next);
    if (next.length === SOLUTION.length) {
      const ok = next.every((n, i) => n === SOLUTION[i]);
      setStatus(ok ? "Circuit closed · +40 XP" : "Short circuit — try again");
    }
  }

  return (
    <GameFrame
      title="Circuit Builder"
      subtitle="Connect power → MCU → sensor → radio → cloud in order."
    >
      <div className="flex flex-wrap gap-2">
        {NODES.map((node) => (
          <Button
            key={node}
            variant="secondary"
            size="sm"
            onClick={() => add(node)}
            disabled={path.includes(node)}
          >
            {node}
          </Button>
        ))}
      </div>
      <p className="mt-4 font-mono text-sm text-sky-200">
        Path: {path.join(" → ") || "—"}
      </p>
      <Button
        className="mt-4"
        variant="outline"
        size="sm"
        onClick={() => {
          setPath([]);
          setStatus(null);
        }}
      >
        Reset
      </Button>
      {status ? <p className="mt-4 text-sm text-violet-200">{status}</p> : null}
    </GameFrame>
  );
}
