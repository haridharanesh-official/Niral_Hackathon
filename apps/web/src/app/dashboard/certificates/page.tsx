import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Certificates
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Achievements unlock
        </h1>
        <p className="mt-2 text-sm text-muted">
          Certificates become downloadable after the closing ceremony when
          attendance and submission criteria are met.
        </p>
      </div>
      <Panel title="Status">
        <p className="text-sm text-muted">
          ☐ Event attendance verified
          <br />
          ☐ Project submitted
          <br />
          ☐ Closing ceremony complete
        </p>
        <Button className="mt-4" size="sm" disabled>
          Download (locked)
        </Button>
      </Panel>
    </div>
  );
}
