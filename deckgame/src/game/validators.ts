import type { GameState } from "./types";
import { getCardDef } from "../data/cards";

export type ValidationError = string;

export function validateStateInvariants(state: GameState): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect every card instance across all zones
  const allInstances = [
    ...state.tradeDeck,
    ...state.tradeRow,
    ...state.explorerPile,
    ...state.scrapHeap,
    ...Object.values(state.players).flatMap(p =>
      [...p.deck, ...p.hand, ...p.discard, ...p.inPlay, ...p.bases]
    ),
  ];

  // No duplicate instanceIds (= no card in two zones)
  const seen = new Set<string>();
  for (const inst of allInstances) {
    if (seen.has(inst.instanceId)) {
      errors.push(`Duplicate instanceId "${inst.instanceId}" (${inst.definitionId})`);
    }
    seen.add(inst.instanceId);
  }

  // Resources are non-negative
  for (const [pid, player] of Object.entries(state.players)) {
    if (player.currentTrade < 0)
      errors.push(`${pid}.currentTrade is negative: ${player.currentTrade}`);
    if (player.currentCombat < 0)
      errors.push(`${pid}.currentCombat is negative: ${player.currentCombat}`);
  }

  // Trade row cap
  if (state.tradeRow.length > 5)
    errors.push(`tradeRow.length > 5: ${state.tradeRow.length}`);

  // No Base in inPlay; no Ship in bases
  for (const [pid, player] of Object.entries(state.players)) {
    for (const inst of player.inPlay) {
      const def = getCardDef(inst.definitionId);
      if (def.type === "base")
        errors.push(`Base "${inst.definitionId}" found in ${pid}.inPlay`);
    }
    for (const inst of player.bases) {
      const def = getCardDef(inst.definitionId);
      if (def.type === "ship")
        errors.push(`Ship "${inst.definitionId}" found in ${pid}.bases`);
    }
  }

  // winner set → phase must be game_over
  if (state.winner !== null && state.phase !== "game_over")
    errors.push(`winner is set to "${state.winner}" but phase is "${state.phase}"`);

  // currentPlayerId references a real player
  if (!Object.prototype.hasOwnProperty.call(state.players, state.currentPlayerId))
    errors.push(`currentPlayerId "${state.currentPlayerId}" is not a valid player`);

  // Each pendingChoice's sourceCardInstanceId must exist somewhere in the game
  for (const choice of state.pendingChoices) {
    if (!seen.has(choice.sourceCardInstanceId))
      errors.push(
        `PendingChoice "${choice.id}" (${choice.type}) references missing sourceCardInstanceId "${choice.sourceCardInstanceId}"`
      );
  }

  return errors;
}
