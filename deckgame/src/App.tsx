import { useState } from "react";
import "./index.css";
import { setupGame } from "./game/engine";
import type { GameState } from "./game/types";
import { GameBoard } from "./ui/GameBoard";
import type { GameMode } from "./ui/gameMode";
import { fr } from "./i18n";
import { useOrientation } from "./hooks/useOrientation";
import { useFullscreen } from "./hooks/useFullscreen";

interface GameSession {
  state: GameState;
  mode: GameMode;
}

const inputStyle = {
  background: "var(--surface2)", border: "1px solid var(--border)",
  color: "var(--text)", borderRadius: "var(--radius)", padding: "10px 12px",
  fontSize: "14px",
} as const;

function StartScreen({ onStart }: { onStart: (p1: string, p2: string, mode: GameMode) => void }) {
  const [p1, setP1] = useState(fr.startScreen.player1Default);
  const [p2, setP2] = useState(fr.startScreen.player2Default);
  const orientation = useOrientation();
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  function handleMode2p() { onStart(p1 || fr.startScreen.player1Default, p2 || fr.startScreen.player2Default, "local_2p"); }
  function handleSolo()   { onStart(p1 || fr.startScreen.player1Default, fr.startScreen.botName, "solo_bot"); }

  if (orientation === "landscape") {
    return (
      <div style={{
        display: "flex", flexDirection: "row", height: "100%",
        padding: "16px 28px", gap: "28px", alignItems: "center",
      }}>
        {/* Left: title + form */}
        <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "var(--accent)", margin: 0, textAlign: "center" }}>
            {fr.startScreen.title}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <input value={p1} onChange={e => setP1(e.target.value)}
              placeholder={fr.startScreen.player1Placeholder} style={inputStyle} />
            <input value={p2} onChange={e => setP2(e.target.value)}
              placeholder={fr.startScreen.player2Placeholder} style={inputStyle} />
            <button className="primary" onClick={handleMode2p}>{fr.startScreen.mode2p}</button>
            <button onClick={handleSolo}>{fr.startScreen.modeSolo}</button>
            {isFullscreenSupported && (
              <button
                aria-label={isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
                onClick={toggleFullscreen}
                style={{ fontSize: "12px", opacity: 0.7, background: "transparent", border: "1px solid var(--border)" }}
              >
                {isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
              </button>
            )}
          </div>
        </div>
        {/* Right: subtitle + rules */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
          <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "13px", margin: 0 }}>
            {fr.startScreen.subtitle}
          </p>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            <p style={{ margin: "0 0 4px 0" }}>{fr.startScreen.rulesLine1}</p>
            <p style={{ margin: 0 }}>{fr.startScreen.rulesLine2}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      height: "100%", gap: "18px", padding: "24px",
      paddingTop: "max(48px, 10%)",
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
          style={inputStyle}
        />
        <input
          value={p2}
          onChange={e => setP2(e.target.value)}
          placeholder={fr.startScreen.player2Placeholder}
          style={inputStyle}
        />
        <button className="primary" onClick={handleMode2p}>{fr.startScreen.mode2p}</button>
        <button onClick={handleSolo}>{fr.startScreen.modeSolo}</button>
        {isFullscreenSupported && (
          <button
            aria-label={isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
            onClick={toggleFullscreen}
            style={{ fontSize: "13px", opacity: 0.7, background: "transparent", border: "1px solid var(--border)" }}
          >
            {isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
          </button>
        )}
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
