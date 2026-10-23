"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Monitor, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listSecurityNotices,
  SecurityNotice,
} from "@/components/auth/login/session-tracker";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ServerSession = {
  id: string;
  deviceName?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  approximateLocation?: string | null;
  loginAt: string;
  lastActivityAt: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SecuritySessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ServerSession[]>([]);
  const [notices, setNotices] = useState<SecurityNotice[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setNotices(listSecurityNotices());
    if (!session?.accessToken) return;
    const res = await fetch(`${apiUrl}/api/sessions`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (res.ok) setSessions(await res.json());
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [session?.accessToken]);

  async function revoke(id: string) {
    if (!session?.accessToken) return;
    await fetch(`${apiUrl}/api/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    setMessage("Session revoked");
    await refresh();
  }

  async function revokeOthers() {
    if (!session?.accessToken) return;
    await fetch(`${apiUrl}/api/sessions/revoke-others`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    setMessage("Other sessions signed out");
    await refresh();
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Security
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Sessions &amp; alerts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Server-tracked devices from login. Revoke remote sessions anytime.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => void revokeOthers()}>
          Sign out other sessions
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out this device
        </Button>
        <Link href="/dashboard/profile">
          <Button type="button" variant="secondary">
            Manage 2FA
          </Button>
        </Link>
      </div>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          Active sessions
        </h2>
        <ul className="mt-4 space-y-3">
          {sessions.length === 0 ? (
            <li className="text-sm text-muted">
              No server sessions yet. Sign in again to register this device.
            </li>
          ) : (
            sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  {/iOS|Android/.test(s.operatingSystem ?? "") ? (
                    <Smartphone className="mt-0.5 h-5 w-5 text-cyan-300" />
                  ) : (
                    <Monitor className="mt-0.5 h-5 w-5 text-sky-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {s.browser ?? "Browser"} · {s.operatingSystem ?? "OS"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {s.approximateLocation ?? "Approximate location"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Login {formatWhen(s.loginAt)} · Last active{" "}
                      {formatWhen(s.lastActivityAt)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void revoke(s.id)}
                >
                  Sign out
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Shield className="h-5 w-5 text-violet-300" />
          Security notifications
        </h2>
        <ul className="mt-4 space-y-3">
          {notices.length === 0 ? (
            <li className="text-sm text-muted">
              No local security events recorded yet.
            </li>
          ) : (
            notices.map((n, i) => (
              <li
                key={`${n.at}-${i}`}
                className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
              >
                <p className="text-sm text-white">{n.title}</p>
                <p className="mt-1 text-xs text-muted">{n.detail}</p>
                <p className="mt-1 font-mono text-[10px] text-sky-300/80">
                  {formatWhen(n.at)}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      {message ? (
        <p className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}
