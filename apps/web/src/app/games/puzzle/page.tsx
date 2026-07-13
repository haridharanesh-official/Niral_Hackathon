import { GameFrame } from "@/components/games/game-frame";

export default function PuzzlePage() {
  return (
    <GameFrame title="Puzzle Challenge" subtitle="Reconstruct the PCB silkscreen.">
      <p className="text-sm text-muted">
        Tile-slide puzzle scaffolded. Play Memory / Circuit Builder for interactive demos.
      </p>
    </GameFrame>
  );
}
