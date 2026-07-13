import { GameFrame } from "@/components/games/game-frame";

export default function CrosswordPage() {
  return (
    <GameFrame title="Crossword" subtitle="IoT vocabulary across the board.">
      <p className="text-sm text-muted">
        Crossword grid builder hooks in during admin game-builder phase.
      </p>
    </GameFrame>
  );
}
