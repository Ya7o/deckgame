import type { CardInstance, GameState, Effect } from "../game/types";
import { getCardDef } from "../data/cards";

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
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>{def.name}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span className={`faction-${def.faction}`}>{def.faction.replace("_", " ")}</span>
              <span>•</span>
              <span>{def.type}</span>
              {def.cost !== null && <span>• Cost {def.cost}</span>}
              {def.defense !== null && <span>• DEF {def.defense}</span>}
              {def.isOutpost && <span style={{ color: "var(--danger)" }}>• OUTPOST</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ minHeight: "auto", padding: "4px 8px" }}>✕</button>
        </div>

        {/* Effects */}
        {def.primaryEffects.length > 0 && (
          <Section title="Primary">
            {def.primaryEffects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{describeEffect(e)}</div>)}
          </Section>
        )}
        {def.allyEffects.length > 0 && (
          <Section title={`Ally (${def.allyEffects[0].faction.replace("_", " ")})`}>
            {def.allyEffects[0].effects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{describeEffect(e)}</div>)}
          </Section>
        )}
        {def.scrapEffects.length > 0 && (
          <Section title="Scrap">
            {def.scrapEffects.map((e, i) => <div key={i} style={{ fontSize: "13px" }}>{describeEffect(e)}</div>)}
          </Section>
        )}

        {/* Zone */}
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
          Zone: {card.currentZone} {card.exhausted ? "• exhausted" : ""}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          {onPlay && <button className="primary" onClick={onPlay}>Play</button>}
          {onBuy && (
            <button
              className="primary"
              onClick={onBuy}
              disabled={def.cost !== null && player.currentTrade < def.cost}
            >
              Buy ({def.cost} Trade)
            </button>
          )}
          {onActivate && (
            <button onClick={onActivate} disabled={card.exhausted}>
              Activate
            </button>
          )}
          {hasSelfScrap && onSelfScrap && (
            <button className="warning" onClick={onSelfScrap}>Self-Scrap</button>
          )}
          {canAttack && (
            <button className="danger" onClick={onAttackBase}>
              Attack (DEF {def.defense})
            </button>
          )}
          <button onClick={onClose}>Close</button>
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

function describeEffect(e: Effect): string {
  switch (e.type) {
    case "gain_trade": return `+${e.amount} Trade`;
    case "gain_combat": return `+${e.amount} Combat`;
    case "gain_authority": return `+${e.amount} Authority`;
    case "draw": return `Draw ${e.amount}`;
    case "draw_per_blob_played_this_turn": return `Draw 1 per Blob card played this turn`;
    case "draw_per_card_scrapped_this_way": return `Draw 1 per card scrapped this way`;
    case "draw_if_two_or_more_bases": return `Draw ${e.amount} if you have 2+ bases`;
    case "opponent_discard": return `Opponent discards ${e.amount}`;
    case "discard_up_to_then_draw_same": return `Discard up to ${e.max}, draw that many`;
    case "scrap_from_hand_or_discard": return `Scrap ${e.amount} from hand/discard${e.optional ? " (optional)" : ""}`;
    case "scrap_from_hand": return `Scrap ${e.amount} from hand${e.optional ? " (optional)" : ""}`;
    case "scrap_trade_row": return `Scrap ${e.amount} from Trade Row${e.optional ? " (optional)" : ""}`;
    case "destroy_target_base": return `Destroy target base${e.optional ? " (optional)" : ""}`;
    case "choose_one": return `Choose one of ${e.options.length} options`;
    case "self_scrap": return `Self-scrap → ${e.effects.map(describeEffect).join(", ")}`;
    case "counts_as_ally_all_factions": return `Counts as ally for all factions`;
    case "acquire_ship_free_to_top_deck": return `Acquire any ship free (top of deck)`;
    case "next_ship_acquired_to_top_deck": return `Next ship acquired goes to top of deck`;
    case "copy_another_ship_played_this_turn": return `Copy another ship played this turn`;
    case "trigger_on_play_ship_gain_combat": return `Each ship played gains +${e.amount} Combat`;
    default: return JSON.stringify(e);
  }
}
