# CARD_EFFECTS_DICTIONARY.md

## Objectif

Traduire les textes de cartes en primitives codables.

## Effets de ressources

```ts
type Effect =
  | { type: "gain_trade"; amount: number }
  | { type: "gain_combat"; amount: number }
  | { type: "gain_authority"; amount: number };
```

- `gain_trade` : ajoute au Trade temporaire du joueur actif.
- `gain_combat` : ajoute au Combat temporaire du joueur actif.
- `gain_authority` : augmente l’Authority du joueur actif, sans plafond.

## Pioche

```ts
| { type: "draw"; amount: number }
| { type: "draw_per_card_scrapped_this_way" }
| { type: "draw_per_blob_played_this_turn" }
| { type: "draw_if_two_or_more_bases"; amount: number; requiredBases: number }
```

La pioche déclenche un reshuffle si le deck est vide.

## Défausse

```ts
| { type: "opponent_discard"; amount: number }
| { type: "discard_up_to_then_draw_same"; max: number }
```

`opponent_discard` crée un pending choice pour le joueur qui doit défausser.

## Scrap

```ts
| { type: "scrap_from_hand_or_discard"; amount: number; optional: boolean }
| { type: "scrap_from_hand"; amount: number; optional: boolean }
| { type: "scrap_trade_row"; amount: number; optional: boolean }
| { type: "self_scrap"; effects: Effect[] }
```

Une carte scrappée quitte définitivement le jeu.

## Choix

```ts
| { type: "choose_one"; options: Effect[][] }
```

Utilisé par Patrol Mech, Barter World, Defense Center, Trading Post, Recycling Station, Blob World.

## Bases et combat

```ts
| { type: "destroy_target_base"; optional: boolean }
```

Détruit une Base ciblée sans payer sa défense.

## Ally

```ts
type AllyEffect = {
  faction: Faction;
  effects: Effect[];
  optional?: boolean;
};
```

Active si une autre carte de même faction est en jeu. Une ally ability ne se déclenche qu’une fois par tour par carte/effet.

## Effets spéciaux

```ts
| { type: "counts_as_ally_all_factions" }
| { type: "acquire_ship_free_to_top_deck" }
| { type: "next_ship_acquired_to_top_deck"; optional: boolean }
| { type: "copy_another_ship_played_this_turn" }
| { type: "trigger_on_play_ship_gain_combat"; amount: number }
```

## Pending choices nécessaires

- `choose_one`
- `select_cards_to_scrap`
- `select_trade_row_card_to_scrap`
- `select_base_to_destroy`
- `select_cards_to_discard_then_draw`
- `opponent_discard`
- `select_ship_to_copy`
- `select_ship_to_acquire_free`

## Cartes à tester en priorité

- Stealth Needle
- Mech World
- Fleet HQ
- Brain World
- Blob Carrier
- Freighter
- Central Office
- Blob World
- Embassy Yacht
- Recycling Station
