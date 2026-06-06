import type { CardDefinition, Effect, AllyEffect, Faction } from "../game/types";

// ---------------------------------------------------------------------------
// Raw source data (from docs/core-set.cards.ts)
// ---------------------------------------------------------------------------

const RAW_CARDS = [
  { id: "explorer", name: "Explorer", quantity: 10, faction: "unaligned", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_trade:2", ally_effects: "", scrap_effects: "self_scrap:gain_combat:2" },
  { id: "scout", name: "Scout", quantity: 16, faction: "unaligned", type: "ship", cost: "", defense: "", is_outpost: false, primary_effects: "gain_trade:1", ally_effects: "", scrap_effects: "" },
  { id: "viper", name: "Viper", quantity: 4, faction: "unaligned", type: "ship", cost: "", defense: "", is_outpost: false, primary_effects: "gain_combat:1", ally_effects: "", scrap_effects: "" },
  // Blob
  { id: "battle_blob", name: "Battle Blob", quantity: 1, faction: "blob", type: "ship", cost: 6, defense: "", is_outpost: false, primary_effects: "gain_combat:8", ally_effects: "ally(blob):draw:1", scrap_effects: "self_scrap:gain_combat:4" },
  { id: "battle_pod", name: "Battle Pod", quantity: 2, faction: "blob", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_combat:4;scrap_trade_row:1_optional", ally_effects: "ally(blob):gain_combat:2", scrap_effects: "" },
  { id: "blob_carrier", name: "Blob Carrier", quantity: 1, faction: "blob", type: "ship", cost: 6, defense: "", is_outpost: false, primary_effects: "gain_combat:7", ally_effects: "ally(blob):acquire_ship_free_to_top_deck", scrap_effects: "" },
  { id: "blob_destroyer", name: "Blob Destroyer", quantity: 2, faction: "blob", type: "ship", cost: 4, defense: "", is_outpost: false, primary_effects: "gain_combat:6", ally_effects: "ally(blob):destroy_target_base_optional;scrap_trade_row:1_optional", scrap_effects: "" },
  { id: "blob_fighter", name: "Blob Fighter", quantity: 3, faction: "blob", type: "ship", cost: 1, defense: "", is_outpost: false, primary_effects: "gain_combat:3", ally_effects: "ally(blob):draw:1", scrap_effects: "" },
  { id: "blob_wheel", name: "Blob Wheel", quantity: 3, faction: "blob", type: "base", cost: 3, defense: 5, is_outpost: false, primary_effects: "gain_combat:1", ally_effects: "", scrap_effects: "self_scrap:gain_trade:3" },
  { id: "blob_world", name: "Blob World", quantity: 1, faction: "blob", type: "base", cost: 8, defense: 7, is_outpost: false, primary_effects: "choose_one:gain_combat:5|draw_per_blob_played_this_turn", ally_effects: "", scrap_effects: "" },
  { id: "mothership", name: "Mothership", quantity: 1, faction: "blob", type: "ship", cost: 7, defense: "", is_outpost: false, primary_effects: "gain_combat:6;draw:1", ally_effects: "ally(blob):draw:1", scrap_effects: "" },
  { id: "ram", name: "Ram", quantity: 2, faction: "blob", type: "ship", cost: 3, defense: "", is_outpost: false, primary_effects: "gain_combat:5", ally_effects: "ally(blob):gain_combat:2", scrap_effects: "self_scrap:gain_trade:3" },
  { id: "the_hive", name: "The Hive", quantity: 1, faction: "blob", type: "base", cost: 5, defense: 5, is_outpost: false, primary_effects: "gain_combat:3", ally_effects: "ally(blob):draw:1", scrap_effects: "" },
  { id: "trade_pod", name: "Trade Pod", quantity: 3, faction: "blob", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_trade:3", ally_effects: "ally(blob):gain_combat:2", scrap_effects: "" },
  // Machine Cult
  { id: "battle_mech", name: "Battle Mech", quantity: 1, faction: "machine_cult", type: "ship", cost: 5, defense: "", is_outpost: false, primary_effects: "gain_combat:4;scrap_from_hand_or_discard:1_optional", ally_effects: "ally(machine_cult):draw:1", scrap_effects: "" },
  { id: "battle_station", name: "Battle Station", quantity: 2, faction: "machine_cult", type: "base", cost: 3, defense: 5, is_outpost: true, primary_effects: "", ally_effects: "", scrap_effects: "self_scrap:gain_combat:5" },
  { id: "brain_world", name: "Brain World", quantity: 1, faction: "machine_cult", type: "base", cost: 8, defense: 6, is_outpost: true, primary_effects: "scrap_from_hand_or_discard:2_optional;draw_per_card_scrapped_this_way", ally_effects: "", scrap_effects: "" },
  { id: "junkyard", name: "Junkyard", quantity: 1, faction: "machine_cult", type: "base", cost: 6, defense: 5, is_outpost: true, primary_effects: "scrap_from_hand_or_discard:1_optional", ally_effects: "", scrap_effects: "" },
  { id: "machine_base", name: "Machine Base", quantity: 1, faction: "machine_cult", type: "base", cost: 7, defense: 6, is_outpost: true, primary_effects: "draw:1;scrap_from_hand:1_optional", ally_effects: "", scrap_effects: "" },
  { id: "mech_world", name: "Mech World", quantity: 1, faction: "machine_cult", type: "base", cost: 5, defense: 6, is_outpost: true, primary_effects: "counts_as_ally_all_factions", ally_effects: "", scrap_effects: "" },
  { id: "missile_bot", name: "Missile Bot", quantity: 3, faction: "machine_cult", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_combat:2;scrap_from_hand_or_discard:1_optional", ally_effects: "ally(machine_cult):gain_combat:2", scrap_effects: "" },
  { id: "missile_mech", name: "Missile Mech", quantity: 1, faction: "machine_cult", type: "ship", cost: 6, defense: "", is_outpost: false, primary_effects: "gain_combat:6;destroy_target_base_optional", ally_effects: "ally(machine_cult):draw:1", scrap_effects: "" },
  { id: "patrol_mech", name: "Patrol Mech", quantity: 2, faction: "machine_cult", type: "ship", cost: 4, defense: "", is_outpost: false, primary_effects: "choose_one:gain_trade:3|gain_combat:5", ally_effects: "ally(machine_cult):scrap_from_hand_or_discard:1_optional", scrap_effects: "" },
  { id: "stealth_needle", name: "Stealth Needle", quantity: 1, faction: "machine_cult", type: "ship", cost: 4, defense: "", is_outpost: false, primary_effects: "copy_another_ship_played_this_turn", ally_effects: "", scrap_effects: "" },
  { id: "supply_bot", name: "Supply Bot", quantity: 3, faction: "machine_cult", type: "ship", cost: 3, defense: "", is_outpost: false, primary_effects: "gain_trade:2;scrap_from_hand_or_discard:1_optional", ally_effects: "ally(machine_cult):gain_combat:2", scrap_effects: "" },
  { id: "trade_bot", name: "Trade Bot", quantity: 3, faction: "machine_cult", type: "ship", cost: 1, defense: "", is_outpost: false, primary_effects: "gain_trade:1;scrap_from_hand_or_discard:1_optional", ally_effects: "ally(machine_cult):gain_combat:2", scrap_effects: "" },
  // Star Empire
  { id: "battlecruiser", name: "Battlecruiser", quantity: 1, faction: "star_empire", type: "ship", cost: 6, defense: "", is_outpost: false, primary_effects: "gain_combat:5;draw:1", ally_effects: "ally(star_empire):opponent_discard:1", scrap_effects: "self_scrap:draw:1;destroy_target_base_optional" },
  { id: "corvette", name: "Corvette", quantity: 2, faction: "star_empire", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_combat:1;draw:1", ally_effects: "ally(star_empire):gain_combat:2", scrap_effects: "" },
  { id: "dreadnaught", name: "Dreadnaught", quantity: 1, faction: "star_empire", type: "ship", cost: 7, defense: "", is_outpost: false, primary_effects: "gain_combat:7;draw:1", ally_effects: "", scrap_effects: "self_scrap:gain_combat:5" },
  { id: "fleet_hq", name: "Fleet HQ", quantity: 1, faction: "star_empire", type: "base", cost: 8, defense: 8, is_outpost: false, primary_effects: "trigger_on_play_ship:gain_combat:1", ally_effects: "", scrap_effects: "" },
  { id: "imperial_fighter", name: "Imperial Fighter", quantity: 3, faction: "star_empire", type: "ship", cost: 1, defense: "", is_outpost: false, primary_effects: "gain_combat:2;opponent_discard:1", ally_effects: "ally(star_empire):gain_combat:2", scrap_effects: "" },
  { id: "imperial_frigate", name: "Imperial Frigate", quantity: 3, faction: "star_empire", type: "ship", cost: 3, defense: "", is_outpost: false, primary_effects: "gain_combat:4;opponent_discard:1", ally_effects: "ally(star_empire):gain_combat:2", scrap_effects: "self_scrap:draw:1" },
  { id: "recycling_station", name: "Recycling Station", quantity: 2, faction: "star_empire", type: "base", cost: 4, defense: 4, is_outpost: true, primary_effects: "choose_one:gain_trade:1|discard_up_to:2_then_draw_same", ally_effects: "", scrap_effects: "" },
  { id: "royal_redoubt", name: "Royal Redoubt", quantity: 1, faction: "star_empire", type: "base", cost: 6, defense: 6, is_outpost: true, primary_effects: "gain_combat:3", ally_effects: "ally(star_empire):opponent_discard:1", scrap_effects: "" },
  { id: "space_station", name: "Space Station", quantity: 2, faction: "star_empire", type: "base", cost: 4, defense: 4, is_outpost: true, primary_effects: "gain_combat:2", ally_effects: "ally(star_empire):gain_combat:2", scrap_effects: "self_scrap:gain_trade:4" },
  { id: "survey_ship", name: "Survey Ship", quantity: 3, faction: "star_empire", type: "ship", cost: 3, defense: "", is_outpost: false, primary_effects: "gain_trade:1;draw:1", ally_effects: "", scrap_effects: "self_scrap:opponent_discard:1" },
  { id: "war_world", name: "War World", quantity: 1, faction: "star_empire", type: "base", cost: 5, defense: 4, is_outpost: true, primary_effects: "gain_combat:3", ally_effects: "ally(star_empire):gain_combat:4", scrap_effects: "" },
  // Trade Federation
  { id: "barter_world", name: "Barter World", quantity: 2, faction: "trade_federation", type: "base", cost: 4, defense: 4, is_outpost: false, primary_effects: "choose_one:gain_trade:2|gain_authority:2", ally_effects: "", scrap_effects: "self_scrap:gain_combat:5" },
  { id: "central_office", name: "Central Office", quantity: 1, faction: "trade_federation", type: "base", cost: 7, defense: 6, is_outpost: false, primary_effects: "gain_trade:2;next_ship_acquired_to_top_deck_optional", ally_effects: "ally(trade_federation):draw:1", scrap_effects: "" },
  { id: "command_ship", name: "Command Ship", quantity: 1, faction: "trade_federation", type: "ship", cost: 8, defense: "", is_outpost: false, primary_effects: "gain_combat:5;gain_authority:4;draw:2", ally_effects: "ally(trade_federation):destroy_target_base_optional", scrap_effects: "" },
  { id: "cutter", name: "Cutter", quantity: 3, faction: "trade_federation", type: "ship", cost: 2, defense: "", is_outpost: false, primary_effects: "gain_trade:2;gain_authority:4", ally_effects: "ally(trade_federation):gain_combat:4", scrap_effects: "" },
  { id: "defense_center", name: "Defense Center", quantity: 1, faction: "trade_federation", type: "base", cost: 5, defense: 5, is_outpost: true, primary_effects: "choose_one:gain_authority:3|gain_combat:2", ally_effects: "ally(trade_federation):gain_combat:2", scrap_effects: "" },
  { id: "embassy_yacht", name: "Embassy Yacht", quantity: 2, faction: "trade_federation", type: "ship", cost: 3, defense: "", is_outpost: false, primary_effects: "gain_trade:3;gain_authority:3;draw_if_two_or_more_bases:2", ally_effects: "", scrap_effects: "" },
  { id: "federation_shuttle", name: "Federation Shuttle", quantity: 3, faction: "trade_federation", type: "ship", cost: 1, defense: "", is_outpost: false, primary_effects: "gain_trade:2", ally_effects: "ally(trade_federation):gain_authority:4", scrap_effects: "" },
  { id: "flagship", name: "Flagship", quantity: 1, faction: "trade_federation", type: "ship", cost: 6, defense: "", is_outpost: false, primary_effects: "gain_combat:5;draw:1", ally_effects: "ally(trade_federation):gain_authority:5", scrap_effects: "" },
  { id: "freighter", name: "Freighter", quantity: 2, faction: "trade_federation", type: "ship", cost: 4, defense: "", is_outpost: false, primary_effects: "gain_trade:4", ally_effects: "ally(trade_federation):next_ship_acquired_to_top_deck_optional", scrap_effects: "" },
  { id: "port_of_call", name: "Port of Call", quantity: 1, faction: "trade_federation", type: "base", cost: 6, defense: 6, is_outpost: true, primary_effects: "gain_trade:3", ally_effects: "", scrap_effects: "self_scrap:draw:1;destroy_target_base_optional" },
  { id: "trade_escort", name: "Trade Escort", quantity: 1, faction: "trade_federation", type: "ship", cost: 5, defense: "", is_outpost: false, primary_effects: "gain_combat:4;gain_authority:4", ally_effects: "ally(trade_federation):draw:1", scrap_effects: "" },
  { id: "trading_post", name: "Trading Post", quantity: 2, faction: "trade_federation", type: "base", cost: 3, defense: 4, is_outpost: true, primary_effects: "choose_one:gain_authority:1|gain_trade:1", ally_effects: "", scrap_effects: "self_scrap:gain_combat:3" },
] as const;

// ---------------------------------------------------------------------------
// Effect parser
// ---------------------------------------------------------------------------

function parseToken(token: string): Effect {
  if (token === "draw_per_card_scrapped_this_way") return { type: "draw_per_card_scrapped_this_way" };
  if (token === "draw_per_blob_played_this_turn") return { type: "draw_per_blob_played_this_turn" };
  if (token === "counts_as_ally_all_factions") return { type: "counts_as_ally_all_factions" };
  if (token === "acquire_ship_free_to_top_deck") return { type: "acquire_ship_free_to_top_deck" };
  if (token === "copy_another_ship_played_this_turn") return { type: "copy_another_ship_played_this_turn" };
  if (token === "destroy_target_base_optional") return { type: "destroy_target_base", optional: true };
  if (token === "next_ship_acquired_to_top_deck_optional") return { type: "next_ship_acquired_to_top_deck", optional: true };

  let m: RegExpMatchArray | null;

  if ((m = token.match(/^gain_trade:(\d+)$/))) return { type: "gain_trade", amount: +m[1] };
  if ((m = token.match(/^gain_combat:(\d+)$/))) return { type: "gain_combat", amount: +m[1] };
  if ((m = token.match(/^gain_authority:(\d+)$/))) return { type: "gain_authority", amount: +m[1] };
  if ((m = token.match(/^draw:(\d+)$/))) return { type: "draw", amount: +m[1] };
  if ((m = token.match(/^draw_if_two_or_more_bases:(\d+)$/))) return { type: "draw_if_two_or_more_bases", amount: +m[1] };
  if ((m = token.match(/^opponent_discard:(\d+)$/))) return { type: "opponent_discard", amount: +m[1] };
  if ((m = token.match(/^discard_up_to:(\d+)_then_draw_same$/))) return { type: "discard_up_to_then_draw_same", max: +m[1] };
  if ((m = token.match(/^scrap_from_hand_or_discard:(\d+)(_optional)?$/))) return { type: "scrap_from_hand_or_discard", amount: +m[1], optional: !!m[2] };
  if ((m = token.match(/^scrap_from_hand:(\d+)(_optional)?$/))) return { type: "scrap_from_hand", amount: +m[1], optional: !!m[2] };
  if ((m = token.match(/^scrap_trade_row:(\d+)(_optional)?$/))) return { type: "scrap_trade_row", amount: +m[1], optional: !!m[2] };
  if ((m = token.match(/^trigger_on_play_ship:gain_combat:(\d+)$/))) return { type: "trigger_on_play_ship_gain_combat", amount: +m[1] };

  throw new Error(`Unknown effect token: "${token}"`);
}

function parseEffects(str: string): Effect[] {
  if (!str) return [];

  if (str.startsWith("choose_one:")) {
    const options = str.slice("choose_one:".length).split("|").map((opt) => [parseToken(opt)]);
    return [{ type: "choose_one", options }];
  }

  if (str.startsWith("self_scrap:")) {
    const inner = str.slice("self_scrap:".length).split(";").map(parseToken);
    return [{ type: "self_scrap", effects: inner }];
  }

  return str.split(";").map(parseToken);
}

function parseAllyEffects(str: string): AllyEffect[] {
  if (!str) return [];
  const m = str.match(/^ally\(([^)]+)\):(.+)$/);
  if (!m) return [];
  const faction = m[1] as Faction;
  const effects = m[2].split(";").map(parseToken);
  return [{ faction, effects }];
}

// ---------------------------------------------------------------------------
// Build typed definitions
// ---------------------------------------------------------------------------

export const CARD_DEFINITIONS: CardDefinition[] = RAW_CARDS.map((raw) => ({
  id: raw.id,
  name: raw.name,
  set: "core" as const,
  quantity: raw.quantity,
  faction: raw.faction as CardDefinition["faction"],
  type: raw.type as CardDefinition["type"],
  cost: raw.cost === "" ? null : (raw.cost as number),
  defense: raw.defense === "" ? null : (raw.defense as number),
  isOutpost: raw.is_outpost,
  primaryEffects: parseEffects(raw.primary_effects),
  allyEffects: parseAllyEffects(raw.ally_effects),
  scrapEffects: parseEffects(raw.scrap_effects),
  roles: [],
}));

const BY_ID = new Map<string, CardDefinition>(CARD_DEFINITIONS.map((d) => [d.id, d]));

export function getCardDef(id: string): CardDefinition {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown card id: "${id}"`);
  return def;
}

export const TRADE_DECK_DEFINITIONS = CARD_DEFINITIONS.filter(
  (d) => d.cost !== null && !["explorer", "scout", "viper"].includes(d.id)
);
