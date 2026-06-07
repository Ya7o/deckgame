import type { GameState, PlayerId, EngineError, PendingChoice } from "./types";
import { type BotProfile, DEFAULT_PROFILE, chooseBestBuy, chooseAttackTarget } from "./bot-profile";
import { getCardDef } from "../data/cards";
import {
  playCard,
  activateBase,
  buyTradeRowCard,
  buyExplorer,
  attackBase,
  attackOpponent,
  endTurn,
  resolvePendingChoice,
} from "./engine";
import type { ChoicePayload } from "./choices";

export const MAX_BOT_ACTIONS_PER_TURN = 200;

export type BotResult =
  | { ok: true; state: GameState; actions: string[] }
  | { ok: false; state: GameState; error: EngineError; actions: string[] };

export type BotOptions = {
  profile?: BotProfile;
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runBotTurn(state: GameState, botPlayerId: PlayerId, opts: BotOptions = {}): BotResult {
  const profile = opts.profile ?? DEFAULT_PROFILE;
  if (state.phase === "game_over") return { ok: true, state, actions: [] };
  if (state.currentPlayerId !== botPlayerId) return { ok: true, state, actions: [] };

  let s = state;
  const actions: string[] = [];
  let iterations = 0;

  while (iterations < MAX_BOT_ACTIONS_PER_TURN) {
    iterations++;

    if (s.phase === "game_over") break;
    if (s.currentPlayerId !== botPlayerId) break;

    // 1. Resolve pending choices for the bot
    const myChoices = s.pendingChoices.filter((c) => c.playerId === botPlayerId);
    if (myChoices.length > 0) {
      const choice = myChoices[0];
      const payload = chooseBotPayload(s, botPlayerId, choice);
      const result = resolvePendingChoice(s, botPlayerId, choice.id, payload);
      if (!result.ok) return { ok: false, state: result.state, error: result.error, actions };
      actions.push(`resolve:${choice.type}`);
      s = result.state;
      continue;
    }

    // 2. Play first card from hand
    const hand = s.players[botPlayerId].hand;
    if (hand.length > 0) {
      const card = hand[0];
      const result = playCard(s, botPlayerId, card.instanceId);
      if (result.ok) {
        actions.push(`play:${card.definitionId}`);
        s = result.state;
        continue;
      }
    }

    // 3. Activate the first ready base
    const readyBase = s.players[botPlayerId].bases.find((b) => !b.exhausted);
    if (readyBase) {
      const result = activateBase(s, botPlayerId, readyBase.instanceId);
      if (result.ok) {
        actions.push(`activate:${readyBase.definitionId}`);
        s = result.state;
        continue;
      }
    }

    // 4. Buy the best affordable card
    const bought = tryBotBuy(s, botPlayerId, actions, profile);
    if (bought) {
      s = bought;
      continue;
    }

    // 5. Attack
    const attacked = tryBotAttack(s, botPlayerId, actions, profile);
    if (attacked) {
      s = attacked;
      continue;
    }

    // 6. Nothing more to do — end turn
    const result = endTurn(s, botPlayerId);
    if (!result.ok) return { ok: false, state: result.state, error: result.error, actions };
    actions.push("end_turn");
    s = result.state;
    break;
  }

  return { ok: true, state: s, actions };
}

// ---------------------------------------------------------------------------
// Buy heuristic: most expensive affordable card first; explorer as fallback
// ---------------------------------------------------------------------------

function tryBotBuy(state: GameState, botPlayerId: PlayerId, actions: string[], profile: BotProfile): GameState | null {
  const trade = state.players[botPlayerId].currentTrade;
  if (trade <= 0) return null;

  // Use profile-aware scoring to pick the best card
  const best = chooseBestBuy(state, botPlayerId, profile);

  if (best) {
    const result = buyTradeRowCard(state, botPlayerId, best.instanceId);
    if (result.ok) {
      actions.push(`buy:${best.definitionId}`);
      return result.state;
    }
  }

  // Explorer fallback
  if (trade >= 2 && state.explorerPile.length > 0) {
    const result = buyExplorer(state, botPlayerId);
    if (result.ok) {
      actions.push("buy:explorer");
      return result.state;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Attack heuristic: outposts first (enables direct attack), then direct
// ---------------------------------------------------------------------------

function tryBotAttack(state: GameState, botPlayerId: PlayerId, actions: string[], profile: BotProfile): GameState | null {
  const target = chooseAttackTarget(state, botPlayerId, profile);
  if (!target) return null;

  if (target.type === "base") {
    const inst = state.players[state.opponentPlayerId].bases.find(b => b.instanceId === target.instanceId);
    const result = attackBase(state, botPlayerId, target.instanceId);
    if (result.ok) {
      actions.push(`attack_base:${inst?.definitionId ?? target.instanceId}`);
      return result.state;
    }
  } else {
    const result = attackOpponent(state, botPlayerId, target.amount);
    if (result.ok) {
      actions.push(`attack_opponent:${target.amount}`);
      return result.state;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Choice resolver — heuristics per choice type
// ---------------------------------------------------------------------------

function chooseBotPayload(state: GameState, botPlayerId: PlayerId, choice: PendingChoice): ChoicePayload {
  switch (choice.type) {
    case "choose_one":
      return { type: "choose_one", optionIndex: 0 };

    case "select_cards_to_scrap":
      // V0 limitation: bot skips optional scrap; sends empty for mandatory
      if (choice.optional) return { type: "skip" };
      return { type: "select_cards", cardIds: [] };

    case "select_trade_row_card_to_scrap": {
      // Scrap the cheapest card to thin the row, even when optional
      const candidates = (choice.candidateIds ?? [])
        .map((id) => state.tradeRow.find((c) => c.instanceId === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
      if (candidates.length === 0) return choice.optional ? { type: "skip" } : { type: "select_cards", cardIds: [] };
      const cheapest = candidates.reduce((a, b) =>
        (getCardDef(a.definitionId).cost ?? 0) <= (getCardDef(b.definitionId).cost ?? 0) ? a : b
      );
      return { type: "select_cards", cardIds: [cheapest.instanceId] };
    }

    case "select_base_to_destroy": {
      // Destroy weakest opponent base, even when optional
      const opponentBases = state.players[state.opponentPlayerId].bases;
      const candidates = (choice.candidateIds ?? [])
        .map((id) => opponentBases.find((b) => b.instanceId === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
      if (candidates.length === 0) return choice.optional ? { type: "skip" } : { type: "select_cards", cardIds: [] };
      const weakest = candidates.reduce((a, b) =>
        (getCardDef(a.definitionId).defense ?? 999) <= (getCardDef(b.definitionId).defense ?? 999) ? a : b
      );
      return { type: "select_cards", cardIds: [weakest.instanceId] };
    }

    case "select_cards_to_discard_then_draw":
      // V0 limitation: bot skips optional discard/redraw
      if (choice.optional) return { type: "skip" };
      return { type: "select_cards", cardIds: [] };

    case "opponent_discard": {
      // Bot discards its cheapest cards when forced
      const player = state.players[botPlayerId];
      const amount = choice.amount ?? 1;
      const sorted = [...player.hand].sort(
        (a, b) => (getCardDef(a.definitionId).cost ?? 0) - (getCardDef(b.definitionId).cost ?? 0)
      );
      return { type: "select_cards", cardIds: sorted.slice(0, amount).map((c) => c.instanceId) };
    }

    case "select_ship_to_copy": {
      const candidateIds = choice.candidateIds ?? [];
      return { type: "select_cards", cardIds: candidateIds.length > 0 ? [candidateIds[0]] : [] };
    }

    case "select_ship_to_acquire_free": {
      const candidates = (choice.candidateIds ?? [])
        .map((id) => state.tradeRow.find((c) => c.instanceId === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined);
      if (candidates.length === 0) return { type: "select_cards", cardIds: [] };
      const best = candidates.reduce((a, b) =>
        (getCardDef(a.definitionId).cost ?? 0) >= (getCardDef(b.definitionId).cost ?? 0) ? a : b
      );
      return { type: "select_cards", cardIds: [best.instanceId] };
    }
  }
}
