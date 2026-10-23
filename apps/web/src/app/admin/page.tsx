"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const builders = [
  "Quiz Builder",
  "Game Builder",
  "Certificate Builder",
  "Problem Statement Builder",
];

export default function AdminPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const allowed = role === "ADMIN" || role === "ORGANIZER";

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Link href="/login">
          <Button size="md" className="cta-primary">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">Admin access requires ORGANIZER or ADMIN role.</p>
        <Link href="/dashboard">
          <Button variant="secondary" size="md">
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-[1400px] space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              Admin & Governance Panel
            </p>
            <h1 className="mt-1 font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              Everything Configurable
            </h1>
          </div>
          <Link href="/dashboard" className="text-xs font-semibold text-[var(--primary)] hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatChip label="Registered Users" value="2,480" />
          <StatChip label="Active Quizzes" value="12" />
          <StatChip label="Interactive Games" value="12" />
          <StatChip label="API Status & Health" value="100% OK" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="NIRAL Event Settings & Governance" className="border-sky-500/30">
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>• Authoritative configuration for NIRAL Hackathon 2026 (Dec 3–4, 2026)</li>
              <li>• Registration capacity, team size limits, and schedule parameters</li>
              <li>• Public event lifecycle: DRAFT → REGISTRATION → LIVE → COMPLETED</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link href="/admin/event-settings">
                <Button size="sm" className="cta-primary">
                  Configure Event Settings
                </Button>
              </Link>
            </div>
          </Panel>

          <Panel title="Role & Permissions">
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>• RBAC matrix · VISITOR → PARTICIPANT → JUDGE → ORGANIZER → ADMIN</li>
              <li>• JWT guards with session signature validation</li>
              <li>• Server-side role enforcement on all protected endpoints</li>
            </ul>
            <Button className="mt-4" size="sm" variant="secondary">
              Manage roles
            </Button>
          </Panel>

          <Panel title="Universal CMS & Live Broadcaster">
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>• Live synced across all pages & API endpoints</li>
              <li>• Hero copy, prizes, timeline dates, and emergency alerts</li>
              <li>• Instant client broadcast without redeploy</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link href="/admin/content">
                <Button size="sm" className="cta-primary">
                  Open Universal CMS
                </Button>
              </Link>
            </div>
          </Panel>

          <Panel title="Interactive Builders" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {builders.map((builder) => (
                <div
                  key={builder}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--sand-50)] p-4 transition hover:border-stone-400"
                >
                  <p className="font-sans font-semibold text-[var(--foreground)]">{builder}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Schema-backed configuration surface for realtime event updates
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="People & Staff Operations">
            <p className="text-xs text-[var(--muted)] mb-3">
              Assign evaluating panels, jury members, and floor mentor stations.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                Mentors
              </Button>
              <Button size="sm" variant="outline">
                Judges
              </Button>
              <Button size="sm" variant="outline">
                Volunteers
              </Button>
            </div>
          </Panel>

          <Panel title="API Management & Gateway">
            <p className="text-xs text-[var(--muted)]">
              Rate limits, security audit logs, and service health probes are active.
            </p>
            <Link href="/api-status">
              <Button className="mt-4" size="sm" variant="secondary">
                Open Status Monitor
              </Button>
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
