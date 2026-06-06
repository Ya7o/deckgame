import { useState } from "react";
import "./index.css";
import { setupGame } from "./game/engine";
import type { GameState } from "./game/types";
import { GameBoard } from "./ui/GameBoard";

function StartScreen({ onStart }: { onStart: (p1: string, p2: string) => void }) {
  const [p1, setP1] = useState("Player 1");
  const [p2, setP2] = useState("Player 2");

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: "20px", padding: "24px",
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "var(--accent)" }}>DECKGAME V0</h1>
      <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "320px" }}>
        Star Realms Core Set · Pass-and-Play · 2 players
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
        <input
          value={p1}
          onChange={e => setP1(e.target.value)}
          placeholder="Player 1 name"
          style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: "14px",
          }}
        />
        <input
          value={p2}
          onChange={e => setP2(e.target.value)}
          placeholder="Player 2 name"
          style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: "14px",
          }}
        />
        <button className="primary" onClick={() => onStart(p1 || "Player 1", p2 || "Player 2")}>
          Start Game
        </button>
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", maxWidth: "320px" }}>
        <p>Each player starts with 8 Scouts + 2 Vipers, 50 Authority.</p>
        <p style={{ marginTop: "4px" }}>Trade Row · Explorer Pile · 80-card Trade Deck.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);

  function startGame(p1: string, p2: string) {
    setGame(setupGame({ player1Name: p1, player2Name: p2 }));
  }

  if (!game) {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <GameBoard
      key={game.gameId}
      initialState={game}
      onNewGame={() => setGame(null)}
    />
  );
}
