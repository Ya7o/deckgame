import { useState } from "react";
import "./index.css";
import { setupGame } from "./game/engine";
import type { GameState } from "./game/types";
import { GameBoard } from "./ui/GameBoard";
import type { GameMode } from "./ui/gameMode";
import { fr } from "./i18n";

interface GameSession {
  state: GameState;
  mode: GameMode;
}

function StartScreen({ onStart }: { onStart: (p1: string, p2: string, mode: GameMode) => void }) {
  const [p1, setP1] = useState(fr.startScreen.player1Default);
  const [p2, setP2] = useState(fr.startScreen.player2Default);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: "20px", padding: "24px",
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "var(--accent)" }}>{fr.startScreen.title}</h1>
      <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "320px" }}>
        {fr.startScreen.subtitle}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
        <input
          value={p1}
          onChange={e => setP1(e.target.value)}
          placeholder={fr.startScreen.player1Placeholder}
          style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: "14px",
          }}
        />
        <input
          value={p2}
          onChange={e => setP2(e.target.value)}
          placeholder={fr.startScreen.player2Placeholder}
          style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: "14px",
          }}
        />
        <button
          className="primary"
          onClick={() => onStart(p1 || fr.startScreen.player1Default, p2 || fr.startScreen.player2Default, "local_2p")}
        >
          {fr.startScreen.mode2p}
        </button>
        <button
          onClick={() => onStart(p1 || fr.startScreen.player1Default, fr.startScreen.botName, "solo_bot")}
        >
          {fr.startScreen.modeSolo}
        </button>
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", maxWidth: "320px" }}>
        <p>{fr.startScreen.rulesLine1}</p>
        <p style={{ marginTop: "4px" }}>{fr.startScreen.rulesLine2}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null);

  function startGame(p1: string, p2: string, mode: GameMode) {
    setSession({ state: setupGame({ player1Name: p1, player2Name: p2 }), mode });
  }

  if (!session) {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <GameBoard
      key={session.state.gameId}
      initialState={session.state}
      gameMode={session.mode}
      onNewGame={() => setSession(null)}
    />
  );
}
