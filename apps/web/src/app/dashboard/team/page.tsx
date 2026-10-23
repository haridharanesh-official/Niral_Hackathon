import { Suspense } from "react";
import TeamDashboardPage from "./team-client";

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted">Loading team workspace…</div>
      }
    >
      <TeamDashboardPage />
    </Suspense>
  );
}
