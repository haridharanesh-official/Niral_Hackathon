"use client";

import { useState } from "react";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

export default function VolunteerPanelPage() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Volunteer Panel
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Floor operations
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatChip label="Checked in" value={412} />
        <StatChip label="Help requests" value={7} />
        <StatChip label="Kits remaining" value={38} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="QR / Check-in Scanner">
          <input
            className="field-input"
            placeholder="Scan or paste participant code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            className="mt-3"
            onClick={() => {
              if (!code.trim()) return;
              setLog((prev) => [`Checked in ${code.trim()} · ${new Date().toLocaleTimeString()}`, ...prev]);
              setCode("");
            }}
          >
            Check in
          </Button>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {log.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Hardware Distribution">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between text-white">
              <span>ESP32 DevKit</span>
              <span className="text-sky-300">24 left</span>
            </li>
            <li className="flex justify-between text-white">
              <span>Raspberry Pi 5</span>
              <span className="text-sky-300">9 left</span>
            </li>
            <li className="flex justify-between text-white">
              <span>Sensor pack</span>
              <span className="text-sky-300">31 left</span>
            </li>
          </ul>
          <Button className="mt-4" variant="secondary" size="sm">
            Log distribution
          </Button>
        </Panel>
      </div>

      <Panel title="Announcements & Help Desk">
        <textarea
          className="field-input min-h-24"
          defaultValue="Wi-Fi SSID: HackOS-Guest · Password at desk A"
        />
        <Button className="mt-3" size="sm">
          Broadcast announcement
        </Button>
      </Panel>
    </div>
  );
}
