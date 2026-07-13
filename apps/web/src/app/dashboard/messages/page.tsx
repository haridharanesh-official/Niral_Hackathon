import { Panel } from "@/components/dashboard/panel";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-muted">Team chat and direct messages.</p>
      </div>
      <Panel title="Inbox">
        <ul className="space-y-3 text-sm">
          <li className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <p className="text-white">Team · Circuit Wolves</p>
            <p className="mt-1 text-muted">Can someone grab the sensor pack?</p>
          </li>
          <li className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <p className="text-white">Mentor · Dr. Maya Chen</p>
            <p className="mt-1 text-muted">Confirmed for 16:30 architecture review.</p>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
