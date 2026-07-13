"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tools = [
  "Idea Generator",
  "Architecture Generator",
  "Documentation Generator",
  "Presentation Generator",
  "Debug Assistant",
  "Component Recommendation",
  "Project Similarity Detection",
  "Pitch Trainer",
  "Resume Builder",
];

export default function AiLabPage() {
  const [tool, setTool] = useState(tools[0]);
  const [prompt, setPrompt] = useState(
    "Build an edge air-quality mesh with on-device anomaly detection.",
  );
  const [output, setOutput] = useState<string | null>(null);

  function generate() {
    setOutput(
      `[${tool}]\n\nBrief for: ${prompt}\n\n1. Problem — city pollution spikes lack street-level sensing.\n2. Architecture — ESP32 nodes → MQTT → edge inference → dashboard.\n3. Demo story — live heatmap + false-positive reduction pitch.\n4. Stretch — mentor-ready BOM and 3-slide deck outline.\n\n(Demo generator — wire to your LLM provider in production.)`,
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
              AI Features
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              HackOS Copilot Lab
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {tools.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={tool === item ? "primary" : "secondary"}
              onClick={() => setTool(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="glass rounded-3xl p-6">
          <textarea
            className="field-input min-h-28"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button className="mt-4" onClick={generate}>
            Generate with {tool}
          </Button>
          {output ? (
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-sky-100">
              {output}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
