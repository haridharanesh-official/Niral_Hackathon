"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Panel, StatChip } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";

const achievements = [
  { title: "First Signal", xp: 10 },
  { title: "Squad Up", xp: 25 },
  { title: "Quiz Master", xp: 50 },
];

const sessions = [
  { title: "Mentor: Embedded Architecture", time: "Today · 16:30" },
  { title: "Pitch Clinic", time: "Tomorrow · 11:00" },
];

const challenges = [
  { title: "Edge Intelligence", status: "In progress" },
  { title: "Secure Firmware", status: "Locked" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Participant Overview
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Welcome, {user?.name?.split(" ")[0] ?? "Hacker"}
        </h1>
        <p className="mt-1 text-muted">
          Track XP, sessions, challenges, and team momentum in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatChip label="XP" value={user?.xp ?? 0} />
        <StatChip label="Rank" value="#128" />
        <StatChip label="Badges" value={achievements.length} />
        <StatChip label="Attendance" value="Checked in" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Current Challenges" className="xl:col-span-2">
          <ul className="space-y-3">
            {challenges.map((item) => (
              <li
                key={item.title}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <span className="text-white">{item.title}</span>
                <span className="font-mono text-xs text-sky-300">{item.status}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <Link href="/quiz">
              <Button size="sm">Open Quiz Arena</Button>
            </Link>
            <Link href="/games">
              <Button size="sm" variant="secondary">
                Mini Games
              </Button>
            </Link>
          </div>
        </Panel>

        <Panel title="Upcoming Sessions">
          <ul className="space-y-3">
            {sessions.map((item) => (
              <li key={item.title} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                <p className="text-sm text-white">{item.title}</p>
                <p className="mt-1 font-mono text-xs text-muted">{item.time}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Achievements & Badges">
          <ul className="space-y-2">
            {achievements.map((item) => (
              <li key={item.title} className="flex justify-between text-sm">
                <span className="text-white">{item.title}</span>
                <span className="text-violet-200">+{item.xp} XP</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Notifications">
          <ul className="space-y-2 text-sm text-muted">
            <li>Hardware kit ready for pickup · Desk B</li>
            <li>Judge briefing published for Track AI</li>
            <li>New mentor slots opened for tomorrow</li>
          </ul>
        </Panel>
        <Panel title="Certificates & Downloads">
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full" disabled>
              Participation certificate (after event)
            </Button>
            <Button variant="secondary" size="sm" className="w-full">
              Download starter kit PDF
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
