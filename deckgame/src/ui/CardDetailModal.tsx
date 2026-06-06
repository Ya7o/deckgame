import type { CardInstance, GameState } from "../game/types";
import { getCardDef } from "../data/cards";
import { fr, getCardNameFr, renderEffectFr } from "../i18n";

interface Props {
  card: CardInstance;
  state: GameState;
  onClose: () => void;
  onPlay?: () => void;
  onBuy?: () => void;
  onActivate?: () => void;
  onSelfScrap?: () => void;
  onAttackBase?: () => void;
}

export function CardDetailModal({ card, state, onClose, onPlay, onBuy, onActivate, onSelfScrap, onAttackBase }: Props) {
  const def = getCardDef(card.definitionId);
  const playerId = state.currentPlayerId;
  const player = state.players[playerId];

  const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
  const canAttack = onAttackBase !== undefined;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px 12px 0 0",
          padding: "16px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>{getCardNameFr(def.id)}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span className={`faction-${def.faction}`}>{fr.factions[def.faction] ?? def.faction}</span>
              <span>•</span>
              <span>{fr.cardTypes[def.type] ?? def.type}</span>
              {def.cost !== null && <span>• {fr.ui.cost} {def.cost}</span>}
              {def.defense !== null && <span>• {fr.ui.defense} {def.defense}</span>}
              {def.isOutpost && <span style={{ color: "var(--danger)" }}>• {fr.ui.outpost}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ minHeight: "auto", padding: "4px 8px" }}>✕</button>
        </div>

        {/* Effects */}
        {def.primaryEffects.length > 0 && (
          <Section title={fr.ui.primary}>
            {def.primaryEffects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{renderEffectFr(e)}</div>)}
          </Section>
        )}
        {def.allyEffects.length > 0 && (
          <Section title={`${fr.ui.ally} (${fr.factions[def.allyEffects[0].faction] ?? def.allyEffects[0].faction})`}>
            {def.allyEffects[0].effects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{renderEffectFr(e)}</div>)}
          </Section>
        )}
        {def.scrapEffects.length > 0 && (
          <Section title={fr.ui.scrap}>
            {def.scrapEffects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{renderEffectFr(e)}</div>)}
          </Section>
        )}

        {/* Zone */}
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
          {fr.ui.zone} : {fr.zones[card.currentZone] ?? card.currentZone}
          {card.exhausted ? ` • ${fr.ui.exhausted}` : ""}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          {onPlay && <button className="primary" onClick={onPlay}>{fr.actions.play}</button>}
          {onBuy && (
            <button
              className="primary"
              onClick={onBuy}
              disabled={def.cost !== null && player.currentTrade < def.cost}
            >
              {fr.actions.buy} ({def.cost} {fr.resources.trade})
            </button>
          )}
          {onActivate && (
            <button onClick={onActivate} disabled={card.exhausted}>
              {fr.actions.activateBase}
            </button>
          )}
          {hasSelfScrap && onSelfScrap && (
            <button className="warning" onClick={onSelfScrap}>{fr.actions.selfScrap}</button>
          )}
          {canAttack && (
            <button className="danger" onClick={onAttackBase}>
              {fr.actions.attackBase} ({fr.ui.defense} {def.defense})
            </button>
          )}
          <button onClick={onClose}>{fr.actions.close}</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{title}</div>
      <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {children}
      </div>
    </div>
  );
}
