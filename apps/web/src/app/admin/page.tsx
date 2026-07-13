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
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-muted">Admin access requires ORGANIZER or ADMIN role.</p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-25" />
      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
              Admin Panel
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              Everything configurable
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatChip label="Users" value="2,480" />
          <StatChip label="Active quizzes" value="12" />
          <StatChip label="Games" value="12" />
          <StatChip label="API health" value="OK" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Role & Permissions">
            <ul className="space-y-2 text-sm text-muted">
              <li>RBAC matrix · VISITOR → ADMIN</li>
              <li>JWT guards on protected Nest routes</li>
              <li>NextAuth session for UI gates</li>
            </ul>
            <Button className="mt-4" size="sm" variant="secondary">
              Manage roles
            </Button>
          </Panel>
          <Panel title="Event Settings">
            <ul className="space-y-2 text-sm text-muted">
              <li>Theme · Cyber glassmorphism</li>
              <li>Max team size · 4</li>
              <li>Registration · Open</li>
            </ul>
            <Button className="mt-4" size="sm" variant="secondary">
              Edit event
            </Button>
          </Panel>
          <Panel title="Builders" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {builders.map((builder) => (
                <div
                  key={builder}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                >
                  <p className="text-white">{builder}</p>
                  <p className="mt-1 text-xs text-muted">
                    Schema-backed configuration surface
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="People Ops">
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
          <Panel title="API Management">
            <p className="text-sm text-muted">
              Rate limits, audit logs, and service health probes are enabled on NestJS.
            </p>
            <Link href="/api-status">
              <Button className="mt-4" size="sm">
                Open status
              </Button>
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
