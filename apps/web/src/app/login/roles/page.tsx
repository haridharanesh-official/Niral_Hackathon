"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  dashboardPathForRole,
  ROLE_LABELS,
} from "@/components/auth/login/login-utils";
import { Button } from "@/components/ui/button";

/**
 * Multi-role selector (§22). Currently one primary role per account;
 * when secondary roles are assigned, list them here for post-login choice.
 */
export default function RoleSelectPage() {
  const { data: session } = useSession();
  const primary = session?.user?.role ?? "PARTICIPANT";
  const roles = [primary];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />
      <div className="glass relative z-10 w-full max-w-md rounded-3xl p-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Choose your workspace
        </h1>
        <p className="mt-2 text-sm text-muted">
          You have access to the following roles. Pick where to continue.
        </p>
        <ul className="mt-6 space-y-3">
          {roles.map((role) => (
            <li key={role}>
              <Link href={dashboardPathForRole(role)}>
                <Button type="button" className="cta-primary w-full justify-between">
                  <span>{ROLE_LABELS[role] ?? role}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                    {role}
                  </span>
                </Button>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/dashboard" className="text-sky-300 hover:underline">
            Skip to default dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
