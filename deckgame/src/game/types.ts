export type PlayerId = "player_1" | "player_2";
export type Faction = "blob" | "machine_cult" | "star_empire" | "trade_federation" | "unaligned";
export type CardType = "ship" | "base";
export type Zone =
  | "deck"
  | "hand"
  | "discard"
  | "in_play"
  | "bases"
  | "trade_deck"
  | "trade_row"
  | "explorer_pile"
  | "scrap_heap";
export type GamePhase =
  | "action_phase"
  | "game_over";

// ---- Effects ----------------------------------------------------------------

export type Effect =
  | { type: "gain_trade"; amount: number }
  | { type: "gain_combat"; amount: number }
  | { type: "gain_authority"; amount: number }
  | { type: "draw"; amount: number }
  | { type: "draw_per_card_scrapped_this_way" }
  | { type: "draw_per_blob_played_this_turn" }
  | { type: "draw_if_two_or_more_bases"; amount: number }
  | { type: "opponent_discard"; amount: number }
  | { type: "discard_up_to_then_draw_same"; max: number }
  | { type: "scrap_from_hand_or_discard"; amount: number; optional: boolean }
  | { type: "scrap_from_hand"; amount: number; optional: boolean }
  | { type: "scrap_trade_row"; amount: number; optional: boolean }
  | { type: "self_scrap"; effects: Effect[] }
  | { type: "choose_one"; options: Effect[][] }
  | { type: "destroy_target_base"; optional: boolean }
  | { type: "counts_as_ally_all_factions" }
  | { type: "acquire_ship_free_to_top_deck" }
  | { type: "next_ship_acquired_to_top_deck"; optional: boolean }
  | { type: "copy_another_ship_played_this_turn" }
  | { type: "trigger_on_play_ship_gain_combat"; amount: number };

export type AllyEffect = {
  faction: Faction;
  effects: Effect[];
  optional?: boolean;
};

// ---- Card definitions -------------------------------------------------------

export type CardDefinition = {
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

// ---- Card instances ---------------------------------------------------------

export type CardInstance = {
  instanceId: string;
  definitionId: string;
  ownerId: PlayerId | null;
  currentZone: Zone;
  exhausted?: boolean;
  copiedFromDefinitionId?: string;
  temporaryFactions?: Faction[];
  createdTurn?: number;
};

// ---- Player state ----------------------------------------------------------

export type PlayerState = {
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
  cardsPlayedThisTurn: string[];
  activatedAllyEffectsThisTurn: string[];
};

// ---- Modifiers & triggers ---------------------------------------------------

export type ActiveModifier = {
  id: string;
  type: "next_ship_acquired_to_top_deck";
  sourceCardInstanceId: string;
  ownerId: PlayerId;
  expiresEndOfTurn: boolean;
};

export type ActiveTrigger = {
  id: string;
  type: "on_play_ship_gain_combat";
  amount: number;
  sourceCardInstanceId: string;
  ownerId: PlayerId;
};

// ---- Pending choices --------------------------------------------------------

export type PendingChoiceType =
  | "choose_one"
  | "select_cards_to_scrap"
  | "select_trade_row_card_to_scrap"
  | "select_base_to_destroy"
  | "select_cards_to_discard_then_draw"
  | "opponent_discard"
  | "select_ship_to_copy"
  | "select_ship_to_acquire_free";

export type PendingChoice = {
  id: string;
  type: PendingChoiceType;
  playerId: PlayerId;
  sourceCardInstanceId: string;
  optional: boolean;
  options?: Effect[][];         // for choose_one
  candidateIds?: string[];      // card instanceIds to pick from
  amount?: number;
  pendingEffects?: Effect[];    // for discard-then-draw
};

// ---- Log -------------------------------------------------------------------

export type GameLogEntry = {
  turn: number;
  playerId: PlayerId | null;
  message: string;
  timestamp: number;
};

// ---- Game over -------------------------------------------------------------

export type GameOverReason = "authority_depleted" | "concede";

// ---- Game state ------------------------------------------------------------

export type GameState = {
  gameId: string;
  players: Record<PlayerId, PlayerState>;
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
  rand?: () => number; // seeded RNG for deterministic reshuffles (B-12)
  winner: PlayerId | null;
  gameOverReason: GameOverReason | null;
};

// ---- Engine result ---------------------------------------------------------

export type EngineError =
  | "not_your_turn"
  | "wrong_phase"
  | "card_not_in_hand"
  | "card_not_in_bases"
  | "base_already_exhausted"
  | "insufficient_trade"
  | "insufficient_combat"
  | "explorer_pile_empty"
  | "outpost_blocking"
  | "card_not_in_trade_row"
  | "pending_choices_unresolved"
  | "invalid_choice"
  | "invalid_target"
  | "game_already_over"
  | "base_not_found"
  | "no_ships_to_copy"
  | "invalid_amount";

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; error: EngineError };

export type SetupOptions = {
  player1Name?: string;
  player2Name?: string;
  seed?: string;
  rand?: () => number;
};
