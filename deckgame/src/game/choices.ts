import type { GameState, PlayerId, EngineResult, EngineError } from "./types";
import { getCardDef } from "../data/cards";
import { addLog, findInstance, moveCard, removeFromZone } from "./utils";
import { applyEffects, reapplyAllAllyEffects } from "./effects";
import { drawCards } from "./draw";
import { refillTradeRow } from "./engine";

export type ChoicePayload =
  | { type: "choose_one"; optionIndex: number }
  | { type: "select_cards"; cardIds: string[] }
  | { type: "skip" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(state: GameState): EngineResult { return { ok: true, state }; }
function err(state: GameState, error: EngineError): EngineResult { return { ok: false, state, error }; }

// ---------------------------------------------------------------------------
// Main resolver — returns EngineResult (validates before mutating state)
// ---------------------------------------------------------------------------

export function resolveChoice(
  state: GameState,
  playerId: PlayerId,
  choiceId: string,
  payload: ChoicePayload
): EngineResult {
  const choice = state.pendingChoices.find((c) => c.id === choiceId);
  if (!choice) return err(state, "invalid_choice");
  if (choice.playerId !== playerId) return err(state, "not_your_turn");

  // Skip is valid only for optional choices
  if (payload.type === "skip") {
    if (!choice.optional) return err(state, "invalid_choice");
    const s = { ...state, pendingChoices: state.pendingChoices.filter(c => c.id !== choiceId) };
    return ok(addLog(s, playerId, `Skipped optional choice.`));
  }

  // Payload type must match choice type
  if (choice.type === "choose_one" && payload.type !== "choose_one") return err(state, "invalid_choice");
  if (choice.type !== "choose_one" && payload.type !== "select_cards") return err(state, "invalid_choice");

  // ---- Per-type validation (before any mutation) --------------------------

  switch (choice.type) {
    case "choose_one": {
      if (payload.type !== "choose_one") return err(state, "invalid_choice");
      const options = choice.options ?? [];
      if (payload.optionIndex < 0 || payload.optionIndex >= options.length)
        return err(state, "invalid_choice");
      break;
    }
    case "select_cards_to_scrap": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      const max = choice.amount ?? 1;
      if (payload.cardIds.length > max) return err(state, "invalid_choice");
      // All selected cards must be valid candidates
      const valid = new Set(choice.candidateIds ?? []);
      if (payload.cardIds.some(id => !valid.has(id))) return err(state, "invalid_target");
      // Cards must actually exist in hand or discard of playerId
      const player = state.players[playerId];
      const accessible = new Set([
        ...player.hand.map(c => c.instanceId),
        ...player.discard.map(c => c.instanceId),
      ]);
      if (payload.cardIds.some(id => !accessible.has(id))) return err(state, "invalid_target");
      break;
    }
    case "select_trade_row_card_to_scrap": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      if (payload.cardIds.length > 1) return err(state, "invalid_choice");
      const valid = new Set(state.tradeRow.map(c => c.instanceId));
      if (payload.cardIds.some(id => !valid.has(id))) return err(state, "invalid_target");
      break;
    }
    case "select_base_to_destroy": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      if (payload.cardIds.length > 1) return err(state, "invalid_choice");
      const opponentBases = new Set(state.players[state.opponentPlayerId].bases.map(c => c.instanceId));
      if (payload.cardIds.some(id => !opponentBases.has(id))) return err(state, "invalid_target");
      break;
    }
    case "select_cards_to_discard_then_draw": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      const max = choice.amount ?? 0;
      if (payload.cardIds.length > max) return err(state, "invalid_choice");
      const handIds = new Set(state.players[playerId].hand.map(c => c.instanceId));
      if (payload.cardIds.some(id => !handIds.has(id))) return err(state, "invalid_target");
      break;
    }
    case "opponent_discard": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      const amount = choice.amount ?? 1;
      const handIds = new Set(state.players[playerId].hand.map(c => c.instanceId));
      if (payload.cardIds.some(id => !handIds.has(id))) return err(state, "invalid_target");
      if (payload.cardIds.length > amount) return err(state, "invalid_choice");
      break;
    }
    case "select_ship_to_copy": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      const [cid] = payload.cardIds;
      if (!cid) return err(state, "invalid_choice");
      const target = state.players[playerId].inPlay.find(c => c.instanceId === cid);
      if (!target) return err(state, "invalid_target");
      if (target.instanceId === choice.sourceCardInstanceId) return err(state, "invalid_target");
      if (getCardDef(target.definitionId).type !== "ship") return err(state, "invalid_target");
      break;
    }
    case "select_ship_to_acquire_free": {
      if (payload.type !== "select_cards") return err(state, "invalid_choice");
      const [cid] = payload.cardIds;
      if (!cid) return err(state, "invalid_choice");
      const target = state.tradeRow.find(c => c.instanceId === cid);
      if (!target) return err(state, "invalid_target");
      if (getCardDef(target.definitionId).type !== "ship") return err(state, "invalid_target");
      break;
    }
  }

  // ---- Validation passed — now mutate state --------------------------------

  let s: GameState = {
    ...state,
    pendingChoices: state.pendingChoices.filter((c) => c.id !== choiceId),
  };

  switch (choice.type) {
    case "choose_one": {
      if (payload.type !== "choose_one") return ok(s);
      return ok(applyEffects(s, playerId, choice.options![payload.optionIndex], choice.sourceCardInstanceId));
    }

    case "select_cards_to_scrap": {
      if (payload.type !== "select_cards") return ok(s);
      let scrappedCount = 0;
      for (const cid of payload.cardIds) {
        const inst = findInstance(cid, s);
        if (!inst) continue;
        s = moveCard(inst, "scrap_heap", s);
        scrappedCount++;
        s = addLog(s, playerId, `Scrapped ${getCardDef(inst.definitionId).name}.`);
      }
      // Brain World: draw per card scrapped
      const srcInst = s.players[playerId].bases.find(c => c.instanceId === choice.sourceCardInstanceId);
      if (srcInst) {
        const def = getCardDef(srcInst.definitionId);
        if (def.primaryEffects.some(e => e.type === "draw_per_card_scrapped_this_way") && scrappedCount > 0) {
          s = drawCards(s, playerId, scrappedCount);
          s = addLog(s, playerId, `Drew ${scrappedCount} card(s) (Brain World).`);
        }
      }
      return ok(s);
    }

    case "select_trade_row_card_to_scrap": {
      if (payload.type !== "select_cards") return ok(s);
      const [cid] = payload.cardIds;
      const inst = s.tradeRow.find(c => c.instanceId === cid);
      if (inst) {
        s = moveCard(inst, "scrap_heap", s);
        s = addLog(s, playerId, `Scrapped ${getCardDef(inst.definitionId).name} from Trade Row.`);
        s = refillTradeRow(s);
      }
      return ok(s);
    }

    case "select_base_to_destroy": {
      if (payload.type !== "select_cards") return ok(s);
      const opponentId = s.opponentPlayerId;
      const [cid] = payload.cardIds;
      const inst = s.players[opponentId].bases.find(c => c.instanceId === cid);
      if (inst) {
        s = moveCard(inst, "discard", s);
        s = addLog(s, playerId, `Destroyed ${getCardDef(inst.definitionId).name}.`);
        s = {
          ...s,
          activeTriggers: s.activeTriggers.filter(t => t.sourceCardInstanceId !== cid),
          activeModifiers: s.activeModifiers.filter(m => m.sourceCardInstanceId !== cid),
        };
      }
      return ok(s);
    }

    case "select_cards_to_discard_then_draw": {
      if (payload.type !== "select_cards") return ok(s);
      let discarded = 0;
      for (const cid of payload.cardIds) {
        const inst = s.players[playerId].hand.find(c => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "discard", s);
        discarded++;
      }
      if (discarded > 0) {
        s = drawCards(s, playerId, discarded);
        s = addLog(s, playerId, `Discarded ${discarded} and drew ${discarded}.`);
      }
      return ok(s);
    }

    case "opponent_discard": {
      if (payload.type !== "select_cards") return ok(s);
      const amount = choice.amount ?? 1;
      for (const cid of payload.cardIds.slice(0, amount)) {
        const inst = s.players[playerId].hand.find(c => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "discard", s);
        s = addLog(s, playerId, `Discarded ${getCardDef(inst.definitionId).name}.`);
      }
      return ok(s);
    }

    case "select_ship_to_copy": {
      if (payload.type !== "select_cards") return ok(s);
      const [cid] = payload.cardIds;
      const original = s.players[playerId].inPlay.find(c => c.instanceId === cid);
      if (!original) return ok(s);
      const originalDef = getCardDef(original.definitionId);
      const needleInst = s.players[playerId].inPlay.find(c => c.instanceId === choice.sourceCardInstanceId);
      if (needleInst) {
        const updated = { ...needleInst, temporaryFactions: [originalDef.faction, ...(needleInst.temporaryFactions ?? [])] };
        s = removeFromZone(needleInst.instanceId, s);
        s = moveCard(updated, "in_play", s);
      }
      s = applyEffects(s, playerId, originalDef.primaryEffects.filter(e => e.type !== "self_scrap"), choice.sourceCardInstanceId);
      // Reapply ally effects: the new temporaryFaction may unlock new ally bonuses
      s = reapplyAllAllyEffects(s, playerId);
      return ok(addLog(s, playerId, `Stealth Needle copied ${originalDef.name}.`));
    }

    case "select_ship_to_acquire_free": {
      if (payload.type !== "select_cards") return ok(s);
      const [cid] = payload.cardIds;
      const inst = s.tradeRow.find(c => c.instanceId === cid);
      if (!inst) return ok(s);
      const updated = { ...inst, ownerId: playerId, currentZone: "deck" as const };
      s = removeFromZone(inst.instanceId, s);
      s = { ...s, players: { ...s.players, [playerId]: { ...s.players[playerId], deck: [updated, ...s.players[playerId].deck] } } };
      s = refillTradeRow(s);
      return ok(addLog(s, playerId, `Acquired ${getCardDef(inst.definitionId).name} for free (top of deck).`));
    }
  }
}
