import { GameFrame } from "@/components/games/game-frame";

export default function DailyPage() {
  return (
    <GameFrame title="Daily Challenge" subtitle="One fresh challenge every 24 hours.">
      <p className="text-sm text-muted">
        Today&apos;s challenge rotates from quiz + game pool. Check back after midnight UTC.
      </p>
    </GameFrame>
  );
}
