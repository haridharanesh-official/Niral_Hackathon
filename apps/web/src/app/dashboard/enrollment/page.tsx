"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ONBOARDING_CHECKLIST } from "@hackos/shared";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/panel";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type EnrollmentPayload = {
  event: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    location?: string | null;
  } | null;
  enrollment: {
    registrationId: string;
    mode: string;
    status: string;
  } | null;
};

export default function EnrollmentPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<EnrollmentPayload | null>(null);
  const [mode, setMode] = useState<"ONLINE" | "ONSITE" | "HYBRID">("ONSITE");
  const [rules, setRules] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean> | null>(
    null,
  );
  const [percent, setPercent] = useState(0);

  async function refresh() {
    if (!session?.accessToken) return;
    const [enrollRes, statusRes] = await Promise.all([
      fetch(`${apiUrl}/api/enrollment/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
      fetch(`${apiUrl}/api/auth/onboarding`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
    ]);
    if (enrollRes.ok) setData(await enrollRes.json());
    if (statusRes.ok) {
      const status = await statusRes.json();
      setChecklist(status.checklist);
      setPercent(status.percent ?? 0);
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [session?.accessToken]);

  async function enroll() {
    if (!session?.accessToken) return;
    setMessage(null);
    const res = await fetch(`${apiUrl}/api/enrollment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        rulesAccepted: rules,
        eligibilityConfirmed: eligible,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(
        typeof body.message === "string"
          ? body.message
          : "Enrollment failed",
      );
      return;
    }
    setMessage(`Registered · ${body.registrationId}`);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Event Enrollment
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Register for the hackathon
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          A verified account is not automatically enrolled. Confirm eligibility
          and accept the rules to receive your Event Registration ID.
        </p>
      </div>

      <RegistrationProgress checklist={checklist} percent={percent} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={data?.event?.name ?? "Active event"}>
          {data?.event ? (
            <ul className="space-y-2 text-sm text-muted">
              <li>
                Starts · {new Date(data.event.startsAt).toLocaleString()}
              </li>
              <li>Ends · {new Date(data.event.endsAt).toLocaleString()}</li>
              <li>Venue · {data.event.location ?? "TBA"}</li>
            </ul>
          ) : (
            <p className="text-sm text-muted">
              No active event found. Seed the database or ask an organizer.
            </p>
          )}
        </Panel>

        <Panel title="Your registration">
          {data?.enrollment ? (
            <div className="space-y-2 text-sm">
              <p className="text-emerald-200">Status · {data.enrollment.status}</p>
              <p className="font-mono text-sky-200">
                {data.enrollment.registrationId}
              </p>
              <p className="text-muted">Mode · {data.enrollment.mode}</p>
              <Link href="/dashboard/team" className="inline-block text-sky-300 hover:underline">
                Continue to team formation →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["ONSITE", "ONLINE", "HYBRID"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      mode === m
                        ? "bg-sky-500/20 text-sky-200"
                        : "bg-white/5 text-muted"
                    }`}
                    onClick={() => setMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <label className="flex items-start gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={rules}
                  onChange={(e) => setRules(e.target.checked)}
                  className="mt-1"
                />
                I accept the event rules, code of conduct, and IP policy.
              </label>
              <label className="flex items-start gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={eligible}
                  onChange={(e) => setEligible(e.target.checked)}
                  className="mt-1"
                />
                I confirm I meet eligibility requirements for this hackathon.
              </label>
              <Button
                type="button"
                className="cta-primary"
                disabled={!rules || !eligible}
                onClick={() => void enroll()}
              >
                Confirm enrollment
              </Button>
              {!checklist?.profile ? (
                <p className="text-xs text-orange-200">
                  Tip:{" "}
                  <Link href="/dashboard/onboarding" className="underline">
                    complete your profile
                  </Link>{" "}
                  before forming a team.
                </p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {message ? (
        <p className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function RegistrationProgress({
  checklist,
  percent,
}: {
  checklist: Record<string, boolean> | null;
  percent: number;
}) {
  return (
    <Panel title="Registration progress">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-muted">Overall</span>
        <span className="font-mono text-sky-300" aria-live="polite">
          {percent}%
        </span>
      </div>
      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Registration progress"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="space-y-2">
        {ONBOARDING_CHECKLIST.map((item) => {
          const done = checklist?.[item.key] ?? false;
          return (
            <li
              key={item.key}
              className="flex items-center gap-2 text-sm"
            >
              <span aria-hidden>{done ? "✔" : "☐"}</span>
              <span className={done ? "text-emerald-200" : "text-muted"}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
