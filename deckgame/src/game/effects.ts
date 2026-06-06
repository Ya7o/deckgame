import type {
  GameState,
  PlayerId,
  Effect,
  Faction,
  CardInstance,
  PendingChoice,
  ActiveTrigger,
  ActiveModifier,
} from "./types";
import { getCardDef } from "../data/cards";
import { drawCards } from "./draw";
import { addLog, newId, findInstance } from "./utils";

// ---------------------------------------------------------------------------
// Faction helpers
// ---------------------------------------------------------------------------

export function getEffectiveFactions(inst: CardInstance): Faction[] {
  const def = getCardDef(inst.definitionId);
  const factions: Faction[] = [def.faction];
  if (inst.temporaryFactions) factions.push(...inst.temporaryFactions);
  // Mech World grants all factions to itself (handled in hasAlly)
  return factions;
}

export function hasMechWorldInPlay(playerId: PlayerId, state: GameState): boolean {
  const player = state.players[playerId];
  return (
    [...player.inPlay, ...player.bases].some(
      (c) => getCardDef(c.definitionId).primaryEffects.some((e) => e.type === "counts_as_ally_all_factions")
    )
  );
}

export function hasAlly(cardInst: CardInstance, faction: Faction, state: GameState): boolean {
  const playerId = cardInst.ownerId!;
  const player = state.players[playerId];
  const allInPlay = [...player.inPlay, ...player.bases];

  if (hasMechWorldInPlay(playerId, state) && faction !== "unaligned") return true;

  return allInPlay.some((other) => {
    if (other.instanceId === cardInst.instanceId) return false;
    const otherFactions = getEffectiveFactions(other);
    return otherFactions.includes(faction);
  });
}

// ---------------------------------------------------------------------------
// Apply a single effect
// ---------------------------------------------------------------------------

export function applyEffect(
  state: GameState,
  playerId: PlayerId,
  effect: Effect,
  sourceCardId: string
): GameState {
  let s = state;
  const player = s.players[playerId];
  const opponent = s.players[s.opponentPlayerId];

  switch (effect.type) {
    case "gain_trade":
      s = { ...s, players: { ...s.players, [playerId]: { ...player, currentTrade: player.currentTrade + effect.amount } } };
      return addLog(s, playerId, `Gained ${effect.amount} Trade.`);

    case "gain_combat":
      s = { ...s, players: { ...s.players, [playerId]: { ...player, currentCombat: player.currentCombat + effect.amount } } };
      return addLog(s, playerId, `Gained ${effect.amount} Combat.`);

    case "gain_authority":
      s = { ...s, players: { ...s.players, [playerId]: { ...player, authority: player.authority + effect.amount } } };
      return addLog(s, playerId, `Gained ${effect.amount} Authority.`);

    case "draw":
      s = drawCards(s, playerId, effect.amount);
      return addLog(s, playerId, `Drew ${effect.amount} card(s).`);

    case "draw_per_blob_played_this_turn": {
      const blobCount = player.cardsPlayedThisTurn.filter((id) => {
        const inst = findInstance(id, s) ?? s.players[playerId].inPlay.find(c => c.instanceId === id) ?? s.players[playerId].bases.find(c => c.instanceId === id);
        if (!inst) return false;
        return getEffectiveFactions(inst).includes("blob");
      }).length;
      if (blobCount > 0) s = drawCards(s, playerId, blobCount);
      return addLog(s, playerId, `Drew ${blobCount} card(s) (Blob World).`);
    }

    case "draw_if_two_or_more_bases": {
      const basesCount = player.bases.length;
      if (basesCount >= 2) {
        s = drawCards(s, playerId, effect.amount);
        return addLog(s, playerId, `Drew ${effect.amount} card(s) (Embassy Yacht).`);
      }
      return s;
    }

    case "draw_per_card_scrapped_this_way":
      // handled in the scrap choice resolution
      return s;

    case "opponent_discard": {
      if (opponent.hand.length === 0) return addLog(s, playerId, `Opponent has no cards to discard.`);
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "opponent_discard",
        playerId: s.opponentPlayerId,
        sourceCardInstanceId: sourceCardId,
        optional: false,
        amount: effect.amount,
        candidateIds: opponent.hand.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `Opponent must discard ${effect.amount} card(s).`);
    }

    case "discard_up_to_then_draw_same": {
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_cards_to_discard_then_draw",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: true,
        amount: effect.max,
        candidateIds: player.hand.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `May discard up to ${effect.max} card(s) then draw that many.`);
    }

    case "scrap_from_hand_or_discard": {
      const candidates = [...player.hand, ...player.discard].map((c) => c.instanceId);
      if (candidates.length === 0) return s;
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_cards_to_scrap",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: effect.optional,
        amount: effect.amount,
        candidateIds: candidates,
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `May scrap ${effect.amount} card(s) from hand/discard.`);
    }

    case "scrap_from_hand": {
      const candidates = player.hand.map((c) => c.instanceId);
      if (candidates.length === 0) return s;
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_cards_to_scrap",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: effect.optional,
        amount: effect.amount,
        candidateIds: candidates,
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `May scrap ${effect.amount} card(s) from hand.`);
    }

    case "scrap_trade_row": {
      if (s.tradeRow.length === 0) return s;
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_trade_row_card_to_scrap",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: effect.optional,
        amount: effect.amount,
        candidateIds: s.tradeRow.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `May scrap a Trade Row card.`);
    }

    case "destroy_target_base": {
      const opponentBases = opponent.bases;
      if (opponentBases.length === 0) {
        return effect.optional ? s : addLog(s, playerId, `No opponent bases to destroy.`);
      }
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_base_to_destroy",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: effect.optional,
        candidateIds: opponentBases.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `Choose an opponent base to destroy.`);
    }

    case "choose_one": {
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "choose_one",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: false,
        options: effect.options,
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `Choose one of ${effect.options.length} options.`);
    }

    case "self_scrap":
      // Handled by activateSelfScrap action
      return s;

    case "counts_as_ally_all_factions":
      // Passive — queried via hasAlly
      return s;

    case "next_ship_acquired_to_top_deck": {
      const mod: ActiveModifier = {
        id: newId("mod"),
        type: "next_ship_acquired_to_top_deck",
        sourceCardInstanceId: sourceCardId,
        ownerId: playerId,
        expiresEndOfTurn: true,
      };
      s = { ...s, activeModifiers: [...s.activeModifiers, mod] };
      return addLog(s, playerId, `Next ship acquired goes to top of deck.`);
    }

    case "acquire_ship_free_to_top_deck": {
      const ships = s.tradeRow.filter((c) => getCardDef(c.definitionId).type === "ship");
      if (ships.length === 0) return addLog(s, playerId, `No ships in Trade Row to acquire.`);
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_ship_to_acquire_free",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: false,
        candidateIds: ships.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `Acquire a ship from Trade Row for free.`);
    }

    case "copy_another_ship_played_this_turn": {
      const ships = player.inPlay.filter((c) => {
        if (c.instanceId === sourceCardId) return false;
        return getCardDef(c.definitionId).type === "ship";
      });
      if (ships.length === 0) return addLog(s, playerId, `No other ships played this turn to copy.`);
      const choice: PendingChoice = {
        id: newId("choice"),
        type: "select_ship_to_copy",
        playerId,
        sourceCardInstanceId: sourceCardId,
        optional: false,
        candidateIds: ships.map((c) => c.instanceId),
      };
      s = { ...s, pendingChoices: [...s.pendingChoices, choice] };
      return addLog(s, playerId, `Choose a ship to copy.`);
    }

    case "trigger_on_play_ship_gain_combat": {
      const trigger: ActiveTrigger = {
        id: newId("trig"),
        type: "on_play_ship_gain_combat",
        amount: effect.amount,
        sourceCardInstanceId: sourceCardId,
        ownerId: playerId,
      };
      s = { ...s, activeTriggers: [...s.activeTriggers, trigger] };
      return addLog(s, playerId, `Fleet HQ active: +${effect.amount} Combat per ship played.`);
    }
  }
}

export function applyEffects(
  state: GameState,
  playerId: PlayerId,
  effects: Effect[],
  sourceCardId: string
): GameState {
  return effects.reduce((s, e) => applyEffect(s, playerId, e, sourceCardId), state);
}

// ---------------------------------------------------------------------------
// Ally effects
// ---------------------------------------------------------------------------

export function applyAvailableAllyEffects(
  state: GameState,
  playerId: PlayerId,
  cardInst: CardInstance
): GameState {
  const def = getCardDef(cardInst.definitionId);
  let s = state;

  for (const allyEff of def.allyEffects) {
    const allyKey = `${cardInst.instanceId}:${allyEff.faction}`;
    if (s.players[playerId].activatedAllyEffectsThisTurn.includes(allyKey)) continue;
    if (!hasAlly(cardInst, allyEff.faction, s)) continue;

    s = {
      ...s,
      players: {
        ...s.players,
        [playerId]: {
          ...s.players[playerId],
          activatedAllyEffectsThisTurn: [...s.players[playerId].activatedAllyEffectsThisTurn, allyKey],
        },
      },
    };
    s = applyEffects(s, playerId, allyEff.effects, cardInst.instanceId);
    s = addLog(s, playerId, `Ally effect triggered for ${def.name}.`);
  }

  return s;
}

// Re-check all in-play cards for newly unlocked ally effects when a new card is played
export function reapplyAllAllyEffects(state: GameState, playerId: PlayerId): GameState {
  let s = state;
  const player = s.players[playerId];
  const allInPlay = [...player.inPlay, ...player.bases];

  for (const inst of allInPlay) {
    s = applyAvailableAllyEffects(s, playerId, inst);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Fleet HQ trigger
// ---------------------------------------------------------------------------

export function applyShipPlayedTriggers(
  state: GameState,
  playerId: PlayerId
): GameState {
  let s = state;
  const triggers = s.activeTriggers.filter(
    (t) => t.type === "on_play_ship_gain_combat" && t.ownerId === playerId
  );
  for (const trigger of triggers) {
    s = applyEffect(s, playerId, { type: "gain_combat", amount: trigger.amount }, trigger.sourceCardInstanceId);
  }
  return s;
}
