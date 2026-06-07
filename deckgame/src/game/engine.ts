import type {
  GameState,
  PlayerId,
  PlayerState,
  EngineResult,
  EngineError,
  SetupOptions,
  CardInstance,
} from "./types";
import {
  TRADE_DECK_DEFINITIONS,
  getCardDef,
} from "../data/cards";
import { drawCards } from "./draw";
import {
  applyEffects,
  reapplyAllAllyEffects,
  applyShipPlayedTriggers,
} from "./effects";
import { addLog, mkInstance, moveCard, newId, removeFromZone, shuffle } from "./utils";
import { resolveChoice, type ChoicePayload } from "./choices";
import { getCardNameFr } from "../i18n";

// ---------------------------------------------------------------------------
// Trade Row refill (exported for choices.ts)
// ---------------------------------------------------------------------------

export function refillTradeRow(state: GameState): GameState {
  let s = state;
  while (s.tradeRow.length < 5 && s.tradeDeck.length > 0) {
    const card = s.tradeDeck[0];
    s = moveCard(card, "trade_row", s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

function ok(state: GameState): EngineResult {
  return { ok: true, state };
}

function err(state: GameState, error: EngineError): EngineResult {
  return { ok: false, state, error };
}

function guardTurn(state: GameState, playerId: PlayerId): EngineError | null {
  if (state.phase === "game_over") return "game_already_over";
  if (state.currentPlayerId !== playerId) return "not_your_turn";
  return null;
}

function guardNoPending(state: GameState, playerId: PlayerId): EngineError | null {
  const mine = state.pendingChoices.filter((c) => c.playerId === playerId);
  if (mine.length > 0) return "pending_choices_unresolved";
  return null;
}

// ---------------------------------------------------------------------------
// setupGame
// ---------------------------------------------------------------------------

export function setupGame(options: SetupOptions = {}): GameState {
  const p1Name = options.player1Name ?? "Player 1";
  const p2Name = options.player2Name ?? "Player 2";
  const rand = options.rand;

  function makeStarterDeck(owner: PlayerId): CardInstance[] {
    const scouts = Array.from({ length: 8 }, () => mkInstance("scout", owner, "deck"));
    const vipers = Array.from({ length: 2 }, () => mkInstance("viper", owner, "deck"));
    return shuffle([...scouts, ...vipers], rand);
  }

  function makePlayer(id: PlayerId, name: string): PlayerState {
    return {
      id,
      name,
      authority: 50,
      deck: makeStarterDeck(id),
      hand: [],
      discard: [],
      inPlay: [],
      bases: [],
      currentTrade: 0,
      currentCombat: 0,
      cardsPlayedThisTurn: [],
      activatedAllyEffectsThisTurn: [],
    };
  }

  // Build trade deck: expand each card by quantity
  const tradeDeckRaw: CardInstance[] = [];
  for (const def of TRADE_DECK_DEFINITIONS) {
    for (let i = 0; i < def.quantity; i++) {
      tradeDeckRaw.push(mkInstance(def.id, null, "trade_deck"));
    }
  }
  const tradeDeck = shuffle(tradeDeckRaw, rand);

  // Explorer pile
  // B-13: Explorer pile initialized to 16 (practical V0 upper bound; real rules are unlimited)
  const explorerPile: CardInstance[] = Array.from({ length: 16 }, () =>
    mkInstance("explorer", null, "explorer_pile")
  );

  let state: GameState = {
    gameId: newId("game"),
    players: {
      player_1: makePlayer("player_1", p1Name),
      player_2: makePlayer("player_2", p2Name),
    },
    currentPlayerId: "player_1",
    opponentPlayerId: "player_2",
    rand: options.rand,
    turnNumber: 1,
    phase: "action_phase",
    tradeDeck,
    tradeRow: [],
    explorerPile,
    scrapHeap: [],
    pendingChoices: [],
    activeModifiers: [],
    activeTriggers: [],
    log: [],
    winner: null,
    gameOverReason: null,
  };

  // Fill trade row
  state = refillTradeRow(state);

  // Draw initial hands: P1 draws 3, P2 draws 5
  // Règle de compensation V0 : le premier joueur pioche 3 cartes au lieu de 5
  // pour réduire l'avantage du premier tour (P1 obtient le premier accès à la
  // rangée commerciale et joue ses vipers en premier). Les simulations PATCH 0022
  // confirment un avantage P1 résiduel de 53-54 %, jugé acceptable pour V0.
  state = drawCards(state, "player_1", 3);
  state = drawCards(state, "player_2", 5);

  state = addLog(state, null, "Partie commencée.");
  return state;
}

// ---------------------------------------------------------------------------
// playCard
// ---------------------------------------------------------------------------

export function playCard(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  const player = state.players[playerId];
  const cardInst = player.hand.find((c) => c.instanceId === cardInstanceId);
  if (!cardInst) return err(state, "card_not_in_hand");

  const def = getCardDef(cardInst.definitionId);
  let s = state;

  // Move to correct zone
  if (def.type === "ship") {
    s = moveCard(cardInst, "in_play", s);
  } else {
    s = moveCard(cardInst, "bases", s);
  }

  // Track played this turn
  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: {
        ...s.players[playerId],
        cardsPlayedThisTurn: [...s.players[playerId].cardsPlayedThisTurn, cardInstanceId],
      },
    },
  };

  s = addLog(s, playerId, `Joue ${getCardNameFr(cardInst.definitionId)}.`);

  if (def.type === "ship") {
    // Fleet HQ trigger fires for ships entering play
    s = applyShipPlayedTriggers(s, playerId);
    // Ships apply their primary effects immediately (excluding self_scrap)
    const shipEffects = def.primaryEffects.filter((e) => e.type !== "self_scrap");
    s = applyEffects(s, playerId, shipEffects, cardInstanceId);
  } else {
    // Bases do NOT apply primary effects on entry — only via activateBase.
    // Exception: register Fleet HQ trigger so future ships benefit from it.
    for (const e of def.primaryEffects) {
      if (e.type === "trigger_on_play_ship_gain_combat") {
        s = applyEffects(s, playerId, [e], cardInstanceId);
      }
    }
    // counts_as_ally_all_factions is passive — no action needed here.
  }

  // Re-evaluate ally effects (base now counts as an ally for other cards)
  s = reapplyAllAllyEffects(s, playerId);

  return ok(s);
}

// ---------------------------------------------------------------------------
// activateBase
// ---------------------------------------------------------------------------

export function activateBase(
  state: GameState,
  playerId: PlayerId,
  baseInstanceId: string
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  const player = state.players[playerId];
  const baseInst = player.bases.find((c) => c.instanceId === baseInstanceId);
  if (!baseInst) return err(state, "card_not_in_bases");
  if (baseInst.exhausted) return err(state, "base_already_exhausted");

  const def = getCardDef(baseInst.definitionId);

  // Mark exhausted
  let s: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        bases: state.players[playerId].bases.map((b) =>
          b.instanceId === baseInstanceId ? { ...b, exhausted: true } : b
        ),
      },
    },
  };

  s = addLog(s, playerId, `Active ${getCardNameFr(baseInst.definitionId)}.`);

  // Apply primary effects (excluding self_scrap and triggers which are set up at play time)
  const effects = def.primaryEffects.filter(
    (e) => e.type !== "self_scrap" && e.type !== "trigger_on_play_ship_gain_combat" && e.type !== "counts_as_ally_all_factions"
  );
  s = applyEffects(s, playerId, effects, baseInstanceId);
  s = reapplyAllAllyEffects(s, playerId);

  return ok(s);
}

// ---------------------------------------------------------------------------
// buyTradeRowCard
// ---------------------------------------------------------------------------

export function buyTradeRowCard(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  const cardInst = state.tradeRow.find((c) => c.instanceId === cardInstanceId);
  if (!cardInst) return err(state, "card_not_in_trade_row");

  const def = getCardDef(cardInst.definitionId);
  const player = state.players[playerId];

  if (player.currentTrade < def.cost!) return err(state, "insufficient_trade");

  let s = state;
  // Deduct cost
  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: { ...s.players[playerId], currentTrade: player.currentTrade - def.cost! },
    },
  };

  // Check for top-deck modifier
  const topDeckMod = s.activeModifiers.find(
    (m) => m.type === "next_ship_acquired_to_top_deck" && m.ownerId === playerId
  );
  const toTop = !!topDeckMod && def.type === "ship";

  const destination = "discard" as const;
  const updated: CardInstance = { ...cardInst, ownerId: playerId, currentZone: destination };
  s = removeFromZone(cardInst.instanceId, s);

  if (toTop) {
    s = {
      ...s,
      players: {
        ...s.players,
        [playerId]: {
          ...s.players[playerId],
          deck: [{ ...updated, currentZone: "deck" }, ...s.players[playerId].deck],
        },
      },
    };
    // Consume the modifier
    s = { ...s, activeModifiers: s.activeModifiers.filter((m) => m.id !== topDeckMod!.id) };
    s = addLog(s, playerId, `Achète ${getCardNameFr(cardInst.definitionId)} → dessus de pioche.`);
  } else {
    s = moveCard(updated, "discard", s);
    s = addLog(s, playerId, `Achète ${getCardNameFr(cardInst.definitionId)}.`);
  }

  s = refillTradeRow(s);
  return ok(s);
}

// ---------------------------------------------------------------------------
// buyExplorer
// ---------------------------------------------------------------------------

export function buyExplorer(state: GameState, playerId: PlayerId): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  if (state.explorerPile.length === 0) return err(state, "explorer_pile_empty");
  const player = state.players[playerId];
  if (player.currentTrade < 2) return err(state, "insufficient_trade");

  let s = state;
  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: { ...s.players[playerId], currentTrade: player.currentTrade - 2 },
    },
  };

  const explorer = s.explorerPile[0];
  const topDeckMod = s.activeModifiers.find(
    (m) => m.type === "next_ship_acquired_to_top_deck" && m.ownerId === playerId
  );

  const updated: CardInstance = { ...explorer, ownerId: playerId };

  if (topDeckMod) {
    s = removeFromZone(explorer.instanceId, s);
    s = { ...s, players: { ...s.players, [playerId]: { ...s.players[playerId], deck: [{ ...updated, currentZone: "deck" }, ...s.players[playerId].deck] } } };
    s = { ...s, activeModifiers: s.activeModifiers.filter((m) => m.id !== topDeckMod.id) };
    s = addLog(s, playerId, `Achète Explorateur → dessus de pioche.`);
  } else {
    s = moveCard(updated, "discard", s);
    s = addLog(s, playerId, `Achète Explorateur.`);
  }

  return ok(s);
}

// ---------------------------------------------------------------------------
// attackBase
// ---------------------------------------------------------------------------

export function attackBase(
  state: GameState,
  playerId: PlayerId,
  baseInstanceId: string
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  const opponentId = state.opponentPlayerId;
  const baseInst = state.players[opponentId].bases.find(
    (c) => c.instanceId === baseInstanceId
  );
  if (!baseInst) return err(state, "base_not_found");

  const def = getCardDef(baseInst.definitionId);
  const defense = def.defense!;
  const player = state.players[playerId];

  if (player.currentCombat < defense) return err(state, "insufficient_combat");

  let s = state;
  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: { ...s.players[playerId], currentCombat: player.currentCombat - defense },
    },
  };

  s = moveCard(baseInst, "discard", s);
  s = addLog(s, playerId, `Détruit ${getCardNameFr(baseInst.definitionId)} (coûte ${defense} Combat).`);

  // Remove triggers/modifiers from destroyed base
  s = {
    ...s,
    activeTriggers: s.activeTriggers.filter((t) => t.sourceCardInstanceId !== baseInstanceId),
    activeModifiers: s.activeModifiers.filter((m) => m.sourceCardInstanceId !== baseInstanceId),
  };

  return ok(s);
}

// ---------------------------------------------------------------------------
// attackOpponent
// ---------------------------------------------------------------------------

export function attackOpponent(
  state: GameState,
  playerId: PlayerId,
  amount: number
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  // Validate amount: must be a positive integer
  if (!Number.isInteger(amount) || amount <= 0) return err(state, "invalid_amount");

  const opponentId = state.opponentPlayerId;
  const opponent = state.players[opponentId];

  // Check for outposts
  const hasOutpost = opponent.bases.some(
    (b) => getCardDef(b.definitionId).isOutpost
  );
  if (hasOutpost) return err(state, "outpost_blocking");

  const player = state.players[playerId];
  if (amount > player.currentCombat) return err(state, "insufficient_combat");

  let s = state;
  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: { ...s.players[playerId], currentCombat: player.currentCombat - amount },
      [opponentId]: { ...s.players[opponentId], authority: opponent.authority - amount },
    },
  };

  s = addLog(s, playerId, `Attaque ${opponent.name} pour ${amount} dégât(s).`);

  // Check game end
  if (s.players[opponentId].authority <= 0) {
    s = { ...s, phase: "game_over", winner: playerId, gameOverReason: "authority_depleted" };
    s = addLog(s, null, `${s.players[playerId].name} gagne !`);
  }

  return ok(s);
}

// ---------------------------------------------------------------------------
// activateSelfScrap
// ---------------------------------------------------------------------------

export function activateSelfScrap(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string
): EngineResult {
  const e = guardTurn(state, playerId) ?? guardNoPending(state, playerId);
  if (e) return err(state, e);

  const player = state.players[playerId];
  const cardInst =
    player.inPlay.find((c) => c.instanceId === cardInstanceId) ??
    player.bases.find((c) => c.instanceId === cardInstanceId);

  if (!cardInst) return err(state, "invalid_target");

  const def = getCardDef(cardInst.definitionId);
  const selfScrapEffect = def.scrapEffects.find((e) => e.type === "self_scrap");
  if (!selfScrapEffect || selfScrapEffect.type !== "self_scrap") return err(state, "invalid_target");

  let s = state;
  // Move to scrap heap
  s = moveCard(cardInst, "scrap_heap", s);
  s = addLog(s, playerId, `Écarte ${getCardNameFr(cardInst.definitionId)}.`);

  // Remove triggers/modifiers
  s = {
    ...s,
    activeTriggers: s.activeTriggers.filter((t) => t.sourceCardInstanceId !== cardInstanceId),
    activeModifiers: s.activeModifiers.filter((m) => m.sourceCardInstanceId !== cardInstanceId),
  };

  // Apply scrap effects
  s = applyEffects(s, playerId, selfScrapEffect.effects, cardInstanceId);

  return ok(s);
}

// ---------------------------------------------------------------------------
// resolvePendingChoice
// ---------------------------------------------------------------------------

export function resolvePendingChoice(
  state: GameState,
  playerId: PlayerId,
  choiceId: string,
  payload: ChoicePayload
): EngineResult {
  if (state.phase === "game_over") return err(state, "game_already_over");
  return resolveChoice(state, playerId, choiceId, payload);
}

// ---------------------------------------------------------------------------
// endTurn
// ---------------------------------------------------------------------------

export function endTurn(state: GameState, playerId: PlayerId): EngineResult {
  if (state.phase === "game_over") return err(state, "game_already_over");
  if (state.currentPlayerId !== playerId) return err(state, "not_your_turn");

  // Must resolve own pending choices first
  const myChoices = state.pendingChoices.filter((c) => c.playerId === playerId && !c.optional);
  if (myChoices.length > 0) return err(state, "pending_choices_unresolved");

  let s = state;

  // Discard optional pending choices
  s = { ...s, pendingChoices: s.pendingChoices.filter((c) => c.playerId !== playerId) };

  const player = s.players[playerId];

  // Discard inPlay ships
  const discard = [...player.discard];
  for (const card of player.inPlay) {
    discard.push({ ...card, currentZone: "discard" });
  }
  // Discard remaining hand
  for (const card of player.hand) {
    discard.push({ ...card, currentZone: "discard" });
  }

  // Unexhaust bases
  const bases = player.bases.map((b) => ({ ...b, exhausted: false }));

  s = {
    ...s,
    players: {
      ...s.players,
      [playerId]: {
        ...player,
        hand: [],
        inPlay: [],
        discard,
        bases,
        currentTrade: 0,
        currentCombat: 0,
        cardsPlayedThisTurn: [],
        activatedAllyEffectsThisTurn: [],
      },
    },
  };

  // Remove modifiers that expire end of turn for this player
  s = {
    ...s,
    activeModifiers: s.activeModifiers.filter(
      (m) => !(m.ownerId === playerId && m.expiresEndOfTurn)
    ),
  };

  // Draw new hand for current player (for their NEXT turn)
  s = drawCards(s, playerId, 5);
  s = addLog(s, playerId, `Pioche pour le prochain tour.`);

  s = addLog(s, playerId, `Fin du tour.`);

  // Switch to next player
  const nextPlayerId: PlayerId = playerId === "player_1" ? "player_2" : "player_1";
  s = {
    ...s,
    currentPlayerId: nextPlayerId,
    opponentPlayerId: playerId,
    turnNumber: playerId === "player_2" ? s.turnNumber + 1 : s.turnNumber,
    phase: "action_phase",

  };

  // Re-trigger Fleet HQ for next player's bases
  const nextPlayer = s.players[nextPlayerId];
  for (const base of nextPlayer.bases) {
    const def = getCardDef(base.definitionId);
    for (const effect of def.primaryEffects) {
      if (effect.type === "trigger_on_play_ship_gain_combat") {
        // Check not already registered
        const already = s.activeTriggers.some(t => t.sourceCardInstanceId === base.instanceId);
        if (!already) {
          s = {
            ...s,
            activeTriggers: [...s.activeTriggers, {
              id: newId("trig"),
              type: "on_play_ship_gain_combat",
              amount: effect.amount,
              sourceCardInstanceId: base.instanceId,
              ownerId: nextPlayerId,
            }],
          };
        }
      }
    }
  }

  return ok(s);
}

// ---------------------------------------------------------------------------
// concedeGame
// ---------------------------------------------------------------------------

export function concedeGame(state: GameState, playerId: PlayerId): EngineResult {
  if (state.phase === "game_over") return err(state, "game_already_over");
  const winnerId: PlayerId = playerId === "player_1" ? "player_2" : "player_1";
  const s: GameState = { ...state, phase: "game_over", winner: winnerId, gameOverReason: "concede" };
  const s2 = addLog(s, playerId, `${state.players[playerId].name} abandonne.`);
  return ok(s2);
}
