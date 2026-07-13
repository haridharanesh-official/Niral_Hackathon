"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const teams = [
  { id: "1", name: "Neon Flux", track: "AI" },
  { id: "2", name: "Circuit Wolves", track: "IoT" },
  { id: "3", name: "Packet Ghosts", track: "Cyber" },
];

const criteria = [
  "innovation",
  "technical",
  "presentation",
  "scalability",
  "impact",
  "ui",
  "business",
] as const;

export default function JudgePanelPage() {
  const [selected, setSelected] = useState(teams[0]);
  const [scores, setScores] = useState<Record<(typeof criteria)[number], number>>({
    innovation: 8,
    technical: 8,
    presentation: 7,
    scalability: 7,
    impact: 8,
    ui: 7,
    business: 6,
  });
  const [comments, setComments] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Judge Panel
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Live evaluation
        </h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
        <Panel title="Assigned Teams">
          <ul className="space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => setSelected(team)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                    selected.id === team.id
                      ? "bg-sky-500/15 text-sky-100"
                      : "text-muted hover:bg-white/5"
                  }`}
                >
                  {team.name}
                  <span className="mt-0.5 block font-mono text-[11px]">{team.track}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title={`Scorecard · ${selected.name}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {criteria.map((key) => (
                <label key={key} className="text-sm">
                  <span className="capitalize text-muted">{key}</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className="field-input mt-1"
                    value={scores[key]}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <textarea
              className="field-input mt-4 min-h-28"
              placeholder="Judge comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <Button className="mt-3">Submit scores</Button>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="PDF Viewer">
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-muted">
                Submission PDF preview
              </div>
            </Panel>
            <Panel title="Video Player">
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-muted">
                Demo video player
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
