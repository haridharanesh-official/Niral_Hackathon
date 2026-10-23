import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

export default function HardwarePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Hardware Booking
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Kits &amp; sensors
        </h1>
      </div>
      <Panel title="Available kits">
        <ul className="space-y-3 text-sm">
          {[
            ["ESP32 Starter", "12 left", "Desk B"],
            ["Raspberry Pi 4", "4 left", "Desk A"],
            ["Sensor pack (env)", "18 left", "Desk B"],
          ].map(([name, stock, desk]) => (
            <li
              key={name}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
            >
              <span className="text-white">{name}</span>
              <span className="font-mono text-xs text-muted">
                {stock} · {desk}
              </span>
            </li>
          ))}
        </ul>
        <Button className="mt-4" size="sm">
          Request booking
        </Button>
      </Panel>
    </div>
  );
}
