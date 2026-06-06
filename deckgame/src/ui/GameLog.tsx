import { useEffect, useRef } from "react";
import type { GameLogEntry } from "../game/types";
import { fr } from "../i18n";

interface Props {
  entries: GameLogEntry[];
  maxHeight?: number;
}

export function GameLog({ entries, maxHeight = 120 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={ref}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "6px 8px",
        maxHeight,
        overflowY: "auto",
        fontSize: "11px",
        lineHeight: 1.5,
      }}
    >
      {entries.slice(-60).map((e, i) => (
        <div
          key={i}
          style={{
            color: e.playerId === null ? "var(--text-muted)" : "var(--text)",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "2px",
            marginBottom: "2px",
          }}
        >
          <span style={{ color: "var(--text-muted)", marginRight: "6px" }}>T{e.turn}</span>
          {e.playerId && <span style={{ marginRight: "4px", opacity: 0.6 }}>[{e.playerId === "player_1" ? "J1" : "J2"}]</span>}
          {e.message}
        </div>
      ))}
      {entries.length === 0 && <div style={{ color: "var(--text-muted)" }}>{fr.ui.noEvents}</div>}
    </div>
  );
}
