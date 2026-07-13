import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const mentors = [
  { name: "Dr. Maya Chen", focus: "Edge ML", slots: "3 open" },
  { name: "Arjun Patel", focus: "Firmware", slots: "1 open" },
  { name: "Sofia Alvarez", focus: "Pitch & Product", slots: "5 open" },
];

export default function MentorPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Mentor Panel
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Book guidance
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {mentors.map((mentor) => (
          <Panel key={mentor.name} title={mentor.name} description={mentor.focus}>
            <p className="text-sm text-muted">{mentor.slots}</p>
            <Button className="mt-4" size="sm">
              Book session
            </Button>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Availability">
          <ul className="space-y-2 text-sm text-muted">
            <li>Sat 10:00–13:00 · Hardware bay</li>
            <li>Sat 16:00–19:00 · Virtual rooms</li>
            <li>Sun 09:00–12:00 · Pitch clinic</li>
          </ul>
        </Panel>
        <Panel title="Meeting Notes & Feedback">
          <textarea
            className="field-input min-h-32"
            defaultValue="Discuss sensor fusion latency and demo storyboard."
          />
          <Button className="mt-3" size="sm" variant="secondary">
            Save notes
          </Button>
        </Panel>
      </div>
    </div>
  );
}
