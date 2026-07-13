import { GameFrame } from "@/components/games/game-frame";

export default function EscapeRoomPage() {
  return (
    <GameFrame title="Escape Room" subtitle="Unlock the lab with sequential cipher keys.">
      <p className="text-sm text-muted">
        Multi-stage cipher room scaffolded for expansion.
      </p>
    </GameFrame>
  );
}
