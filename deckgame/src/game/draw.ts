import type { GameState, PlayerId } from "./types";
import { shuffle, moveCard, addLog } from "./utils";

export function drawCards(state: GameState, playerId: PlayerId, amount: number): GameState {
  let s = state;
  for (let i = 0; i < amount; i++) {
    s = drawOne(s, playerId);
  }
  return s;
}

function drawOne(state: GameState, playerId: PlayerId): GameState {
  let s = state;
  const player = s.players[playerId];

  if (player.deck.length === 0) {
    if (player.discard.length === 0) return s; // nothing to draw
    // reshuffle
    const shuffled = shuffle(player.discard);
    s = {
      ...s,
      players: {
        ...s.players,
        [playerId]: {
          ...s.players[playerId],
          deck: shuffled.map((c) => ({ ...c, currentZone: "deck" as const })),
          discard: [],
        },
      },
    };
    s = addLog(s, playerId, "Reshuffled discard into deck.");
  }

  const card = s.players[playerId].deck[0];
  if (!card) return s;
  return moveCard(card, "hand", s);
}
