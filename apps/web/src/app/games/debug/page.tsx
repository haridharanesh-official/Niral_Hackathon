"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameFrame } from "@/components/games/game-frame";

const SNIPPET = [
  "int sensor = analogRead(A0);",
  "float volts = sensor * (5.0 / 1023.0);",
  "if (volts = 2.5) { // bug",
  "  Serial.println(\"midscale\");",
  "}",
];

export default function DebugChallengePage() {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <GameFrame
      title="Debug Challenge"
      subtitle="Click the buggy line in this embedded snippet."
    >
      <div className="space-y-2 font-mono text-sm">
        {SNIPPET.map((line, index) => (
          <button
            key={line}
            type="button"
            onClick={() => setPicked(index)}
            className={`block w-full rounded-xl px-3 py-2 text-left ${
              picked === index
                ? "bg-sky-500/20 text-sky-100"
                : "bg-black/25 text-muted hover:bg-white/5"
            }`}
          >
            <span className="mr-3 text-violet-300">{index + 1}</span>
            {line}
          </button>
        ))}
      </div>
      {picked !== null ? (
        <p className="mt-4 text-sm text-violet-200">
          {picked === 2
            ? "Correct — assignment used instead of comparison · +30 XP"
            : "Not quite — look for an accidental assignment."}
        </p>
      ) : null}
      <Button
        className="mt-4"
        size="sm"
        variant="outline"
        onClick={() => setPicked(null)}
      >
        Reset
      </Button>
    </GameFrame>
  );
}
