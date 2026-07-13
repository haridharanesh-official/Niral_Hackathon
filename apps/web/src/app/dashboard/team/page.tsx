"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Team = {
  id: string;
  name: string;
  inviteCode: string;
  status: string;
  description?: string | null;
  members: Array<{
    role: string;
    user: { id: string; name: string; email: string; xp: number };
  }>;
  sharedNotes?: Array<{ id: string; title: string; content: string }>;
  submission?: { status: string; title: string } | null;
};

export default function TeamDashboardPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("Architecture sketch + BOM draft");

  async function refresh() {
    if (!session?.accessToken) return;
    const res = await fetch(`${apiUrl}/api/teams/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (res.ok) setTeam(await res.json());
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [session?.accessToken]);

  async function createTeam() {
    if (!session?.accessToken) return;
    const res = await fetch(`${apiUrl}/api/teams`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.message ?? "Could not create team");
      return;
    }
    setTeam(data);
    setMessage("Team created");
  }

  async function joinTeam() {
    if (!session?.accessToken) return;
    const res = await fetch(`${apiUrl}/api/teams/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.message ?? "Could not join team");
      return;
    }
    setTeam(data);
    setMessage("Joined team");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Team Dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Squad Command
        </h1>
      </div>

      {!team ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Create Team">
            <input
              className="field-input"
              placeholder="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button className="mt-3" onClick={createTeam}>
              Create
            </Button>
          </Panel>
          <Panel title="Join Team">
            <input
              className="field-input"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <Button className="mt-3" variant="secondary" onClick={joinTeam}>
              Join
            </Button>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title={team.name} description={`Status · ${team.status}`} className="xl:col-span-2">
            <p className="font-mono text-xs text-violet-200">
              Invite code: {team.inviteCode}
            </p>
            <ul className="mt-4 space-y-2">
              {team.members.map((member) => (
                <li
                  key={member.user.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm"
                >
                  <span className="text-white">
                    {member.user.name}{" "}
                    <span className="text-muted">· {member.role}</span>
                  </span>
                  <span className="font-mono text-sky-300">{member.user.xp} XP</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Submission Status">
            <p className="text-sm text-white">
              {team.submission?.title ?? "No submission yet"}
            </p>
            <p className="mt-2 font-mono text-xs text-muted">
              {team.submission?.status ?? "DRAFT"}
            </p>
            <p className="mt-4 text-sm text-muted">
              Mentor assigned · Hardware kit pending pickup
            </p>
          </Panel>

          <Panel title="Shared Notes" className="xl:col-span-2">
            <textarea
              className="field-input min-h-28"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted">
              Local draft for now — realtime sync arrives with Socket.IO phase work.
            </p>
          </Panel>

          <Panel title="Progress Tracker">
            <ul className="space-y-2 text-sm text-muted">
              <li>✓ Team formed</li>
              <li>✓ Challenge selected</li>
              <li>○ Prototype photos</li>
              <li>○ Final PPT upload</li>
            </ul>
          </Panel>
        </div>
      )}

      {message ? (
        <p className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}
