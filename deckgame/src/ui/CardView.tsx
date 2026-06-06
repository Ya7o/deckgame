import type { CardInstance } from "../game/types";
import { getCardDef } from "../data/cards";
import { fr, getCardNameFr } from "../i18n";

interface Props {
  card: CardInstance;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  showActions?: boolean;
}

const FACTION_SHORT: Record<string, string> = {
  blob: "BLB",
  machine_cult: "MC",
  star_empire: "SE",
  trade_federation: "TF",
  unaligned: "—",
};

export function CardView({ card, onClick, selected, dimmed }: Props) {
  const def = getCardDef(card.definitionId);
  const nameFr = getCardNameFr(card.definitionId);

  const style: React.CSSProperties = {
    width: "var(--card-w)",
    height: "var(--card-h)",
    border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    background: selected ? "#1e2e5a" : "var(--surface)",
    cursor: onClick ? "pointer" : "default",
    opacity: dimmed ? 0.45 : 1,
    display: "flex",
    flexDirection: "column",
    padding: "4px",
    gap: "2px",
    flexShrink: 0,
    fontSize: "10px",
    position: "relative",
    transition: "opacity 0.1s, border-color 0.1s",
    overflow: "hidden",
  };

  return (
    <div style={style} onClick={onClick} title={nameFr}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className={`faction-${def.faction}`} style={{ fontWeight: "bold", fontSize: "9px" }}>
          {FACTION_SHORT[def.faction]}
        </span>
        {def.cost !== null && (
          <span style={{ color: "var(--trade)", fontWeight: "bold" }}>{def.cost}</span>
        )}
      </div>

      {/* Name */}
      <div style={{ fontWeight: "bold", fontSize: "10px", lineHeight: 1.2, wordBreak: "break-word" }}>
        {nameFr}
      </div>

      {/* Type badges */}
      <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
        {def.type === "base" && (
          <span className={def.isOutpost ? "badge badge-outpost" : "badge badge-base"}>
            {def.isOutpost ? "AVP." : "BASE"}
          </span>
        )}
        {def.type === "ship" && <span className="badge badge-ship">VAIS.</span>}
      </div>

      {/* Defense */}
      {def.defense !== null && (
        <div style={{ color: "var(--danger)", fontSize: "10px" }}>{fr.ui.defense} {def.defense}</div>
      )}

      {/* Effects summary */}
      <div style={{ color: "var(--text-muted)", fontSize: "9px", lineHeight: 1.2, overflow: "hidden", flex: 1 }}>
        {summaryEffects(def)}
      </div>

      {/* Exhausted overlay */}
      {card.exhausted && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.5px",
        }}>
          {fr.ui.used}
        </div>
      )}
    </div>
  );
}

function summaryEffects(def: ReturnType<typeof getCardDef>): string {
  const parts: string[] = [];
  for (const e of def.primaryEffects) {
    switch (e.type) {
      case "gain_trade": parts.push(`+${e.amount}C`); break;
      case "gain_combat": parts.push(`+${e.amount}⚔`); break;
      case "gain_authority": parts.push(`+${e.amount}A`); break;
      case "draw": parts.push(`P${e.amount}`); break;
      case "choose_one": parts.push("Choix"); break;
      case "opponent_discard": parts.push("Déf."); break;
      case "scrap_from_hand_or_discard": parts.push("Éc."); break;
      case "destroy_target_base": parts.push("Détr. base"); break;
      case "copy_another_ship_played_this_turn": parts.push("Cop. vais."); break;
      case "counts_as_ally_all_factions": parts.push("Allié ×4"); break;
      case "trigger_on_play_ship_gain_combat": parts.push("Vais.→+1⚔"); break;
      case "next_ship_acquired_to_top_deck": parts.push("Dessus"); break;
      case "acquire_ship_free_to_top_deck": parts.push("Vais. gratuit"); break;
      case "draw_if_two_or_more_bases": parts.push(`P${e.amount} si 2+ bases`); break;
      default: break;
    }
  }
  if (def.allyEffects.length > 0) parts.push("Allié•");
  if (def.scrapEffects.length > 0) parts.push("Écart•");
  return parts.join(" ");
}
