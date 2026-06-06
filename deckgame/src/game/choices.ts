import type { GameState, PlayerId } from "./types";
import { getCardDef } from "../data/cards";
import { addLog, findInstance, moveCard, removeFromZone } from "./utils";
import { applyEffects } from "./effects";
import { drawCards } from "./draw";
import { refillTradeRow } from "./engine";

export type ChoicePayload =
  | { type: "choose_one"; optionIndex: number }
  | { type: "select_cards"; cardIds: string[] }
  | { type: "skip" };

export function resolveChoice(
  state: GameState,
  playerId: PlayerId,
  choiceId: string,
  payload: ChoicePayload
): GameState {
  const choice = state.pendingChoices.find((c) => c.id === choiceId);
  if (!choice) return state;
  if (choice.playerId !== playerId) return state;

  let s: GameState = {
    ...state,
    pendingChoices: state.pendingChoices.filter((c) => c.id !== choiceId),
  };

  if (payload.type === "skip" && choice.optional) {
    return addLog(s, playerId, `Skipped optional choice.`);
  }

  switch (choice.type) {
    case "choose_one": {
      if (payload.type !== "choose_one") return s;
      const options = choice.options!;
      const idx = payload.optionIndex;
      if (idx < 0 || idx >= options.length) return s;
      return applyEffects(s, playerId, options[idx], choice.sourceCardInstanceId);
    }

    case "select_cards_to_scrap": {
      if (payload.type !== "select_cards") return s;
      let scrappedCount = 0;
      for (const cid of payload.cardIds) {
        const inst = findInstance(cid, s);
        if (!inst) continue;
        s = moveCard(inst, "scrap_heap", s);
        scrappedCount++;
        s = addLog(s, playerId, `Scrapped ${getCardDef(inst.definitionId).name}.`);
      }
      // Brain World: draw per card scrapped
      const srcInst = findInstance(choice.sourceCardInstanceId, s)
        ?? [...s.players[playerId].bases].find(c => c.instanceId === choice.sourceCardInstanceId);
      if (srcInst) {
        const def = getCardDef(srcInst.definitionId);
        if (def.primaryEffects.some(e => e.type === "draw_per_card_scrapped_this_way") && scrappedCount > 0) {
          s = drawCards(s, playerId, scrappedCount);
          s = addLog(s, playerId, `Drew ${scrappedCount} card(s) (Brain World).`);
        }
      }
      return s;
    }

    case "select_trade_row_card_to_scrap": {
      if (payload.type !== "select_cards") return s;
      for (const cid of payload.cardIds.slice(0, 1)) {
        const inst = s.tradeRow.find((c) => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "scrap_heap", s);
        s = addLog(s, playerId, `Scrapped ${getCardDef(inst.definitionId).name} from Trade Row.`);
        s = refillTradeRow(s);
      }
      return s;
    }

    case "select_base_to_destroy": {
      if (payload.type !== "select_cards") return s;
      const opponentId = s.opponentPlayerId;
      for (const cid of payload.cardIds.slice(0, 1)) {
        const inst = s.players[opponentId].bases.find((c) => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "discard", s);
        s = addLog(s, playerId, `Destroyed ${getCardDef(inst.definitionId).name}.`);
        // Remove any triggers from destroyed base
        s = {
          ...s,
          activeTriggers: s.activeTriggers.filter(t => t.sourceCardInstanceId !== cid),
          activeModifiers: s.activeModifiers.filter(m => m.sourceCardInstanceId !== cid),
        };
      }
      return s;
    }

    case "select_cards_to_discard_then_draw": {
      if (payload.type !== "select_cards") return s;
      let discarded = 0;
      for (const cid of payload.cardIds) {
        const inst = s.players[playerId].hand.find((c) => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "discard", s);
        discarded++;
      }
      if (discarded > 0) {
        s = drawCards(s, playerId, discarded);
        s = addLog(s, playerId, `Discarded ${discarded} and drew ${discarded}.`);
      }
      return s;
    }

    case "opponent_discard": {
      if (payload.type !== "select_cards") return s;
      const amount = choice.amount ?? 1;
      for (const cid of payload.cardIds.slice(0, amount)) {
        const inst = s.players[playerId].hand.find((c) => c.instanceId === cid);
        if (!inst) continue;
        s = moveCard(inst, "discard", s);
        s = addLog(s, playerId, `Discarded ${getCardDef(inst.definitionId).name}.`);
      }
      return s;
    }

    case "select_ship_to_copy": {
      if (payload.type !== "select_cards") return s;
      const [cid] = payload.cardIds;
      if (!cid) return s;
      const original = s.players[playerId].inPlay.find((c) => c.instanceId === cid);
      if (!original) return s;
      const originalDef = getCardDef(original.definitionId);
      // Apply copied ship primary effects; mark stealth needle as copying
      const needleInst = s.players[playerId].inPlay.find(c => c.instanceId === choice.sourceCardInstanceId);
      if (needleInst) {
        // Give needle the copied ship's faction temporarily
        const updated = { ...needleInst, temporaryFactions: [originalDef.faction, ...(needleInst.temporaryFactions ?? [])] };
        s = removeFromZone(needleInst.instanceId, s);
        s = moveCard(updated, "in_play", s);
      }
      s = applyEffects(s, playerId, originalDef.primaryEffects, choice.sourceCardInstanceId);
      return addLog(s, playerId, `Stealth Needle copied ${originalDef.name}.`);
    }

    case "select_ship_to_acquire_free": {
      if (payload.type !== "select_cards") return s;
      const [cid] = payload.cardIds;
      if (!cid) return s;
      const inst = s.tradeRow.find((c) => c.instanceId === cid);
      if (!inst) return s;
      const updated = { ...inst, ownerId: playerId, currentZone: "deck" as const };
      s = removeFromZone(inst.instanceId, s);
      // Place on top of deck
      s = { ...s, players: { ...s.players, [playerId]: { ...s.players[playerId], deck: [updated, ...s.players[playerId].deck] } } };
      s = refillTradeRow(s);
      return addLog(s, playerId, `Acquired ${getCardDef(inst.definitionId).name} for free (top of deck).`);
    }
  }
}
