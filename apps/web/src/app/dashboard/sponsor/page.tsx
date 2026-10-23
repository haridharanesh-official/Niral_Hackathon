import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

export default function SponsorPortalPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Sponsor Portal
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Brand presence &amp; leads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Track booth traffic, challenge engagement, and talent shortlists for
          your HackOS sponsorship package.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatChip label="Booth visits" value=" thr" />
        <StatChip label="Challenge entries" value="128" />
        <StatChip label="Shortlisted talent" value="24" />
        <StatChip label="Swag claims" value="310" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sponsored challenge">
          <p className="text-sm text-muted">
            Edge Intelligence track · submissions close Sunday 16:00.
          </p>
          <Button className="mt-4" size="sm">
            View entries
          </Button>
        </Panel>
        <Panel title="Talent pipeline">
          <ul className="space-y-2 text-sm text-muted">
            <li>12 resumes shared with your hiring portal</li>
            <li>5 mentor office-hour bookings this weekend</li>
            <li>Logo placement live on home + livestream</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
