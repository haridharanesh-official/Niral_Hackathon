import { GameFrame } from "@/components/games/game-frame";

export default function WeeklyPage() {
  return (
    <GameFrame
      title="Weekly Challenge"
      subtitle="Harder multi-stage boss fight for elite XP."
    >
      <p className="text-sm text-muted">
        Weekly boss challenge unlocks every Monday 00:00.
      </p>
    </GameFrame>
  );
}
