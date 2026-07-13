import { Panel } from "@/components/dashboard/panel";

const badges = [
  { title: "First Signal", detail: "Logged in for the first time" },
  { title: "Squad Up", detail: "Joined or created a team" },
  { title: "Quiz Master", detail: "Scored 90%+ on any quiz" },
  { title: "Night Owl", detail: "Submitted after midnight" },
];

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Achievements</h1>
        <p className="mt-1 text-muted">Badges and XP milestones unlocked this season.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {badges.map((badge) => (
          <Panel key={badge.title} title={badge.title} description={badge.detail}>
            <p className="font-mono text-xs text-violet-200">Badge unlocked</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
