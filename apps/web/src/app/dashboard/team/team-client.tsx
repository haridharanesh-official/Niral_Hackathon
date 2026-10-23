"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DEFAULT_MAX_TEAM_SIZE, HACKATHON_THEMES, SUBMISSION_LOCKED_STATUSES } from "@hackos/shared";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Team = {
  id: string;
  name: string;
  inviteCode: string;
  status: string;
  description?: string | null;
  theme?: string | null;
  visibility?: string;
  recruitmentStatus?: string;
  mentorId?: string | null;
  leader?: { id: string; name: string } | null;
  members: Array<{
    role: string;
    user: { id: string; name: string; email: string; xp: number };
  }>;
  joinRequests?: Array<{
    id: string;
    message?: string | null;
    user: { id: string; name: string; email: string };
  }>;
  submission?: { status: string; title: string } | null;
};

type DiscoverTeam = Team & {
  matchReasons?: string[];
  members: Array<{ role: string }>;
};

export default function TeamDashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [discover, setDiscover] = useState<DiscoverTeam[]>([]);
  const [tab, setTab] = useState<"create" | "join" | "discover">("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<string>(HACKATHON_THEMES[0]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [recruitmentStatus, setRecruitmentStatus] = useState<"OPEN" | "CLOSED">(
    "OPEN",
  );
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) {
      setInviteCode(invite);
      setTab("join");
    }
  }, [searchParams]);

  const token = session?.accessToken;
  const isLeader =
    team?.leader?.id === session?.user?.id ||
    team?.members.some(
      (m) => m.role === "LEADER" && m.user.id === session?.user?.id,
    );

  async function refresh() {
    if (!token) return;
    const [meRes, discRes] = await Promise.all([
      fetch(`${apiUrl}/api/teams/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiUrl}/api/teams/discover`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    if (meRes.ok) {
      const data = await meRes.json();
      setTeam(data && data.id ? data : null);
    }
    if (discRes.ok) setDiscover(await discRes.json());
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [token]);

  async function createTeam() {
    if (!token) return;
    setMessage(null);
    const res = await fetch(`${apiUrl}/api/teams`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        theme,
        visibility,
        recruitmentStatus,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(
        typeof data.message === "string" ? data.message : "Could not create team",
      );
      return;
    }
    setTeam(data);
    setMessage("Team created");
  }

  async function joinTeam() {
    if (!token) return;
    setMessage(null);
    const res = await fetch(`${apiUrl}/api/teams/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(
        typeof data.message === "string" ? data.message : "Could not join team",
      );
      return;
    }
    setTeam(data);
    setMessage("Joined team");
  }

  async function requestJoin(teamId: string) {
    if (!token) return;
    const res = await fetch(`${apiUrl}/api/teams/request-join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamId, message: "I'd like to join your squad." }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(
      res.ok
        ? "Join request sent to the team leader"
        : typeof data.message === "string"
          ? data.message
          : "Request failed",
    );
  }

  async function respond(requestId: string, accept: boolean) {
    if (!token) return;
    const res = await fetch(`${apiUrl}/api/teams/respond-join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId, accept }),
    });
    if (res.ok) await refresh();
  }

  function inviteLink() {
    if (!team) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/dashboard/team?invite=${team.inviteCode}`;
  }

  async function copyInvite(kind: "code" | "link") {
    if (!team) return;
    const value = kind === "code" ? team.inviteCode : inviteLink();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Team Formation
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Build your squad
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Create or join a team (2–{DEFAULT_MAX_TEAM_SIZE} members by default).
          One active team per event. Leaders manage invites and join requests.
        </p>
      </div>

      {!team ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["create", "Create team"],
                ["join", "Join with code"],
                ["discover", "Discover teams"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs ${
                  tab === id
                    ? "bg-sky-500/20 text-sky-200"
                    : "bg-white/5 text-muted"
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "create" ? (
            <Panel title="Create team">
              <div className="space-y-3">
                <input
                  className="field-input"
                  placeholder="Team name (unique in event)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <textarea
                  className="field-input min-h-28"
                  placeholder="Description (50–500 characters)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <select
                  className="field-input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  {HACKATHON_THEMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {(["PUBLIC", "PRIVATE"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs ${
                        visibility === v
                          ? "bg-violet-500/20 text-violet-100"
                          : "bg-white/5 text-muted"
                      }`}
                      onClick={() => setVisibility(v)}
                    >
                      {v}
                    </button>
                  ))}
                  {(["OPEN", "CLOSED"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs ${
                        recruitmentStatus === v
                          ? "bg-emerald-500/20 text-emerald-100"
                          : "bg-white/5 text-muted"
                      }`}
                      onClick={() => setRecruitmentStatus(v)}
                    >
                      Recruiting {v}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => void createTeam()}
                  disabled={name.length < 2 || description.length < 50}
                >
                  Create team
                </Button>
              </div>
            </Panel>
          ) : null}

          {tab === "join" ? (
            <Panel title="Join with invitation code or link">
              <input
                className="field-input"
                placeholder="Paste invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.trim())}
              />
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => void joinTeam()}
              >
                Join team
              </Button>
            </Panel>
          ) : null}

          {tab === "discover" ? (
            <Panel title="Recommended & public teams">
              <ul className="space-y-3">
                {discover.length === 0 ? (
                  <li className="text-sm text-muted">No open public teams yet.</li>
                ) : (
                  discover.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-white">{t.name}</p>
                          <p className="mt-1 text-xs text-muted">
                            {t.theme ?? "Theme TBA"} · {t.members.length} members
                            · Leader {t.leader?.name ?? "—"}
                          </p>
                          {t.matchReasons?.length ? (
                            <ul className="mt-2 space-y-1 text-xs text-sky-200/90">
                              {t.matchReasons.map((r) => (
                                <li key={r}>Why suggested: {r}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void requestJoin(t.id)}
                        >
                          Request to join
                        </Button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title={team.name}
            description={`Theme · ${team.theme ?? "TBA"}`}
            className="xl:col-span-2"
          >
            <p className="text-sm text-muted">{team.description}</p>
            <p className="mt-3 text-sm text-white">
              Leader · {team.leader?.name ?? "—"}
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
                  <span className="font-mono text-sky-300">
                    {member.user.xp} XP
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Status">
            <ul className="space-y-2 text-sm text-muted">
              <li>✔ Registered team</li>
              <li>{team.theme ? "✔" : "☐"} Theme selected</li>
              <li>{team.mentorId ? "✔" : "☐"} Mentor assigned</li>
              <li>
                {team.submission &&
                SUBMISSION_LOCKED_STATUSES.includes(
                  team.submission.status as (typeof SUBMISSION_LOCKED_STATUSES)[number],
                )
                  ? "✔"
                  : "☐"}{" "}
                Project submitted
              </li>
            </ul>
            <p className="mt-4 font-mono text-xs text-violet-200">
              Status · {team.status} · Recruiting {team.recruitmentStatus}
            </p>
          </Panel>

          <Panel title="Invitations" className="xl:col-span-2">
            <p className="font-mono text-xs text-sky-200">
              Code: {team.inviteCode}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void copyInvite("code")}
              >
                Copy invitation code
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void copyInvite("link")}
              >
                Copy shareable link
              </Button>
              <a
                className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-xs text-sky-300 hover:bg-white/5"
                href={`mailto:?subject=Join%20my%20HackOS%20team&body=${encodeURIComponent(
                  `Join ${team.name} with code ${team.inviteCode}\n${inviteLink()}`,
                )}`}
              >
                Invite by email
              </a>
            </div>
            {copied ? (
              <p className="mt-2 text-xs text-emerald-300">Copied to clipboard</p>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              QR: open the invite link on mobile or generate a QR from the code.
              Invites stop working when the team is full or closed.
            </p>
          </Panel>

          {isLeader && team.joinRequests?.length ? (
            <Panel title="Join requests">
              <ul className="space-y-3">
                {team.joinRequests.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-xl border border-white/8 p-3 text-sm"
                  >
                    <p className="text-white">{req.user.name}</p>
                    <p className="text-xs text-muted">{req.message}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void respond(req.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void respond(req.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      )}

      <p className="text-sm text-muted">
        Need profile or event registration first?{" "}
        <Link
          href="/dashboard/onboarding"
          className="text-sky-300 hover:underline"
        >
          Profile
        </Link>
        {" · "}
        <Link
          href="/dashboard/enrollment"
          className="text-sky-300 hover:underline"
        >
          Enrollment
        </Link>
      </p>

      {message ? (
        <p className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}
