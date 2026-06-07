import type { CardInstance } from "../game/types";
import { getCardDef } from "../data/cards";
import { fr, getCardNameFr } from "../i18n";

interface Props {
  card: CardInstance;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  /** Carte en main jouable (highlight bleu) */
  playable?: boolean;
  /** Base adverse attaquable (highlight rouge) */
  attackable?: boolean;
}

const FACTION_SHORT: Record<string, string> = {
  blob: "BLB",
  machine_cult: "MC",
  star_empire: "SE",
  trade_federation: "TF",
  unaligned: "—",
};

const FACTION_COLOR: Record<string, string> = {
  blob: "var(--blob)",
  machine_cult: "var(--machine)",
  star_empire: "var(--empire)",
  trade_federation: "var(--federation)",
  unaligned: "var(--unaligned)",
};

export function CardView({ card, onClick, selected, dimmed, playable, attackable }: Props) {
  const def = getCardDef(card.definitionId);
  const nameFr = getCardNameFr(card.definitionId);

  let borderColor = "var(--border)";
  let boxShadow = "none";
  if (selected)   { borderColor = "var(--accent)";  boxShadow = "0 0 0 2px rgba(91,143,255,0.35)"; }
  else if (attackable) { borderColor = "var(--danger)"; boxShadow = "0 0 0 2px rgba(255,85,85,0.4)"; }
  else if (playable)   { borderColor = "var(--accent)"; boxShadow = "0 0 0 2px rgba(91,143,255,0.25)"; }

  const style: React.CSSProperties = {
    width: "var(--card-w)",
    height: "var(--card-h)",
    border: `1px solid ${borderColor}`,
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
    transition: "opacity 0.1s, border-color 0.1s, box-shadow 0.1s",
    overflow: "hidden",
    boxShadow,
  };

  return (
    <div style={style} onClick={onClick} title={nameFr}>
      {/* Faction color strip */}
      <div style={{
        height: "3px",
        background: FACTION_COLOR[def.faction] ?? "var(--border)",
        margin: "-4px -4px 2px -4px",
        borderRadius: "var(--radius) var(--radius) 0 0",
        flexShrink: 0,
      }} />

      {/* Header: faction abbr + cost */}
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
            {def.isOutpost ? "Avant-p." : "Base"}
          </span>
        )}
        {def.type === "ship" && <span className="badge badge-ship">Vais.</span>}
      </div>

      {/* Defense */}
      {def.defense !== null && (
        <div style={{ color: "var(--danger)", fontSize: "10px" }}>{fr.ui.defense} {def.defense}</div>
      )}

      {/* Effects summary — readable abbreviations */}
      <div style={{ color: "var(--text-muted)", fontSize: "9px", lineHeight: 1.3, overflow: "hidden", flex: 1 }}>
        {summaryEffects(def)}
      </div>

      {/* Exhausted overlay */}
      {card.exhausted && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
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
      case "gain_trade":     parts.push(`+${e.amount}C`); break;
      case "gain_combat":    parts.push(`+${e.amount}⚔`); break;
      case "gain_authority": parts.push(`+${e.amount}♥`); break;
      case "draw":           parts.push(`Pioche ${e.amount}`); break;
      case "choose_one":     parts.push("Choix"); break;
      case "opponent_discard": parts.push("Déf.adv."); break;
      case "scrap_from_hand_or_discard": parts.push("Écart"); break;
      case "scrap_from_hand": parts.push("Écart main"); break;
      case "scrap_trade_row": parts.push("Écart rangée"); break;
      case "destroy_target_base": parts.push("Détr.base"); break;
      case "copy_another_ship_played_this_turn": parts.push("Copie vais."); break;
      case "counts_as_ally_all_factions": parts.push("Allié ×4"); break;
      case "trigger_on_play_ship_gain_combat": parts.push(`Vais.→+${e.amount}⚔`); break;
      case "next_ship_acquired_to_top_deck": parts.push("Dessus pioche"); break;
      case "acquire_ship_free_to_top_deck": parts.push("Vais.gratuit"); break;
      case "draw_if_two_or_more_bases": parts.push(`Pioche ${e.amount} si 2+bases`); break;
      case "discard_up_to_then_draw_same": parts.push(`Déf.→P.`); break;
      case "draw_per_blob_played_this_turn": parts.push("P./Blob"); break;
      case "draw_per_card_scrapped_this_way": parts.push("P./écart"); break;
      case "self_scrap": {
        const sub = e.effects.map(se => {
          if (se.type === "gain_trade")   return `+${se.amount}C`;
          if (se.type === "gain_combat")  return `+${se.amount}⚔`;
          if (se.type === "gain_authority") return `+${se.amount}♥`;
          return "…";
        }).join(" ");
        parts.push(`Écart→${sub}`);
        break;
      }
      default: break;
    }
  }
  if (def.allyEffects.length > 0) parts.push("Allié•");
  if (def.scrapEffects.some(e => e.type !== "self_scrap")) parts.push("Écart•");
  return parts.join(" ");
}
