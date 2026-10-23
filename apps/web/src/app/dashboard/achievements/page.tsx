import Link from "next/link";
import { Panel } from "@/components/dashboard/panel";
import { BADGES, XP_TODAY } from "@/components/dashboard/command-center/intelligence";

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
          Gamification
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Achievements &amp; XP
        </h1>
        <p className="mt-1 text-muted">
          Rewards for meaningful engagement — not spammy clicks.
        </p>
      </div>

      <Panel title="Today's XP" description={`${XP_TODAY.current} / ${XP_TODAY.goal}`}>
        <ul className="space-y-2 text-sm">
          {XP_TODAY.recent.map((r) => (
            <li key={r.label} className="flex justify-between text-muted">
              <span>{r.label}</span>
              <span className="font-mono text-emerald-300">+{r.xp}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        {BADGES.map((badge) => (
          <Panel
            key={badge.id}
            title={badge.title}
            description={badge.description}
          >
            <p className="text-xs text-muted">Unlock · {badge.criteria}</p>
            <p className="mt-2 font-mono text-xs text-violet-200">
              {badge.rarity}
              {badge.earned && badge.earnedAt
                ? ` · Earned ${badge.earnedAt}`
                : " · Locked"}
            </p>
          </Panel>
        ))}
      </div>

      <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
        ← Back to command center
      </Link>
    </div>
  );
}
