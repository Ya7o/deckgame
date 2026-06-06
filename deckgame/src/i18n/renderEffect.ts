import type { Effect } from "../game/types";
import { fr } from "./fr";

export function getCardNameFr(definitionId: string): string {
  return fr.cardNames[definitionId] ?? definitionId;
}

export function renderEffectFr(e: Effect): string {
  switch (e.type) {
    case "gain_trade":
      return `+${e.amount} ${fr.resources.trade}`;
    case "gain_combat":
      return `+${e.amount} ${fr.resources.combat}`;
    case "gain_authority":
      return `+${e.amount} ${fr.resources.authority}`;
    case "draw":
      return `Piochez ${e.amount} carte${e.amount > 1 ? "s" : ""}`;
    case "draw_per_blob_played_this_turn":
      return "Piochez 1 carte par Blob joué ce tour";
    case "draw_per_card_scrapped_this_way":
      return "Piochez 1 carte par carte écartée ainsi";
    case "draw_if_two_or_more_bases":
      return `Piochez ${e.amount} si vous avez 2+ bases`;
    case "opponent_discard":
      return `L'adversaire défausse ${e.amount} carte${e.amount > 1 ? "s" : ""}`;
    case "discard_up_to_then_draw_same":
      return `Défaussez jusqu'à ${e.max}, piochez autant`;
    case "scrap_from_hand_or_discard":
      return `Écartez ${e.amount} de la main ou défausse${e.optional ? " (optionnel)" : ""}`;
    case "scrap_from_hand":
      return `Écartez ${e.amount} de la main${e.optional ? " (optionnel)" : ""}`;
    case "scrap_trade_row":
      return `Écartez ${e.amount} de la rangée commerciale${e.optional ? " (optionnel)" : ""}`;
    case "destroy_target_base":
      return `Détruisez une base ciblée${e.optional ? " (optionnel)" : ""}`;
    case "choose_one":
      return `Choisissez parmi ${e.options.length} effets`;
    case "self_scrap":
      return `Écartez-vous → ${e.effects.map(renderEffectFr).join(", ")}`;
    case "counts_as_ally_all_factions":
      return "Compte comme allié de toutes les factions";
    case "acquire_ship_free_to_top_deck":
      return "Acquérez un vaisseau gratuitement (dessus de pioche)";
    case "next_ship_acquired_to_top_deck":
      return `Prochain vaisseau acquis au dessus de la pioche${e.optional ? " (optionnel)" : ""}`;
    case "copy_another_ship_played_this_turn":
      return "Copiez un autre vaisseau joué ce tour";
    case "trigger_on_play_ship_gain_combat":
      return `Chaque vaisseau joué gagne +${e.amount} Combat`;
    default:
      return JSON.stringify(e);
  }
}
