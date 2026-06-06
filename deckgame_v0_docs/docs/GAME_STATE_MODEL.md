# GAME_STATE_MODEL.md

## Objectif

Définir l’état complet du jeu pour le moteur V0.

## Types

```ts
type PlayerId = "player_1" | "player_2";
type Faction = "blob" | "machine_cult" | "star_empire" | "trade_federation" | "unaligned";
type CardType = "ship" | "base";
type Zone = "deck" | "hand" | "discard" | "in_play" | "bases" | "trade_deck" | "trade_row" | "explorer_pile" | "scrap_heap";
type GamePhase = "setup" | "start_turn" | "action_phase" | "resolving_choice" | "end_turn" | "game_over";
```

## CardDefinition

```ts
type CardDefinition = {
  id: string;
  name: string;
  set: "core";
  quantity: number;
  faction: Faction;
  type: CardType;
  cost: number | null;
  defense: number | null;
  isOutpost: boolean;
  primaryEffects: Effect[];
  allyEffects: AllyEffect[];
  scrapEffects: Effect[];
  roles: string[];
  implementationNotes?: string;
};
```

## CardInstance

```ts
type CardInstance = {
  instanceId: string;
  definitionId: string;
  ownerId: PlayerId | null;
  currentZone: Zone;
  exhausted?: boolean;
  copiedFromDefinitionId?: string;
  temporaryFactions?: Faction[];
  createdTurn?: number;
};
```

Chaque instance doit exister dans une seule zone.

## PlayerState

```ts
type PlayerState = {
  id: PlayerId;
  name: string;
  authority: number;
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  inPlay: CardInstance[];
  bases: CardInstance[];
  currentTrade: number;
  currentCombat: number;
  pendingDiscard: number;
  cardsPlayedThisTurn: string[];
  activatedAllyEffectsThisTurn: string[];
  hasEndedTurn: boolean;
};
```

## GameState

```ts
type GameState = {
  gameId: string;
  players: Record<PlayerId, PlayerState>;
  playerOrder: PlayerId[];
  currentPlayerId: PlayerId;
  opponentPlayerId: PlayerId;
  turnNumber: number;
  phase: GamePhase;
  tradeDeck: CardInstance[];
  tradeRow: CardInstance[];
  explorerPile: CardInstance[];
  scrapHeap: CardInstance[];
  pendingChoices: PendingChoice[];
  activeModifiers: ActiveModifier[];
  activeTriggers: ActiveTrigger[];
  log: GameLogEntry[];
  randomSeed?: string;
  winner: PlayerId | null;
  gameOverReason: GameOverReason | null;
};
```

## Active modifiers

- `next_ship_acquired_to_top_deck`

Expire en fin de tour ou après usage.

## Active triggers

- `on_play_ship_gain_combat` pour Fleet HQ.

Le trigger n’est pas rétroactif.

## Invariants

- Aucune carte dans deux zones.
- Trade Row maximum 5 cartes.
- Aucun Trade/Combat négatif.
- Aucun Ship dans `bases`.
- Aucune Base dans `inPlay`.
- Si `winner !== null`, alors `phase = game_over`.
