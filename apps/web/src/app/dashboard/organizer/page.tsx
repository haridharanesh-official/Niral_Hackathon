import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

export default function OrganizerPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Organizer Panel
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Event control room
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatChip label="Registrations" value="2,480" />
        <StatChip label="Teams" value="610" />
        <StatChip label="Mentors online" value="42" />
        <StatChip label="Open tickets" value="11" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Analytics Snapshot">
          <ul className="space-y-2 text-sm text-muted">
            <li>Peak check-in hour · 09:00–10:00</li>
            <li>Most popular track · Edge Intelligence</li>
            <li>Quiz completion rate · 73%</li>
            <li>Hardware utilization · 81%</li>
          </ul>
        </Panel>
        <Panel title="Announcements">
          <textarea
            className="field-input min-h-28"
            defaultValue="Final submission deadline extended by 30 minutes."
          />
          <Button className="mt-3" size="sm">
            Publish
          </Button>
        </Panel>
        <Panel title="Certificates">
          <p className="text-sm text-muted">
            Generate participation and winner certificates with QR verification.
          </p>
          <Button className="mt-3" variant="secondary" size="sm">
            Open certificate builder
          </Button>
        </Panel>
        <Panel title="Reports">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">
              Registrations CSV
            </Button>
            <Button size="sm" variant="outline">
              Judge scores
            </Button>
            <Button size="sm" variant="outline">
              Hardware inventory
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
