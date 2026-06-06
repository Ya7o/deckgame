import type { CardInstance, Zone, GameState, PlayerId } from "./types";
import { getCardDef } from "../data/cards";

let counter = 0;
export function newId(prefix = "inst"): string {
  return `${prefix}_${++counter}_${Date.now()}`;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mkInstance(
  defId: string,
  owner: PlayerId | null,
  zone: Zone
): CardInstance {
  return {
    instanceId: newId(),
    definitionId: defId,
    ownerId: owner,
    currentZone: zone,
  };
}

export function isBase(instanceId: string, state: GameState): boolean {
  const inst = findInstance(instanceId, state);
  if (!inst) return false;
  return getCardDef(inst.definitionId).type === "base";
}

export function findInstance(id: string, state: GameState): CardInstance | undefined {
  const allZones: CardInstance[] = [
    ...state.tradeDeck,
    ...state.tradeRow,
    ...state.explorerPile,
    ...state.scrapHeap,
    ...Object.values(state.players).flatMap((p) => [
      ...p.deck,
      ...p.hand,
      ...p.discard,
      ...p.inPlay,
      ...p.bases,
    ]),
  ];
  return allZones.find((c) => c.instanceId === id);
}

export function removeFromZone(id: string, state: GameState): GameState {
  const remove = (arr: CardInstance[]) => arr.filter((c) => c.instanceId !== id);
  return {
    ...state,
    tradeDeck: remove(state.tradeDeck),
    tradeRow: remove(state.tradeRow),
    explorerPile: remove(state.explorerPile),
    scrapHeap: remove(state.scrapHeap),
    players: {
      player_1: {
        ...state.players.player_1,
        deck: remove(state.players.player_1.deck),
        hand: remove(state.players.player_1.hand),
        discard: remove(state.players.player_1.discard),
        inPlay: remove(state.players.player_1.inPlay),
        bases: remove(state.players.player_1.bases),
      },
      player_2: {
        ...state.players.player_2,
        deck: remove(state.players.player_2.deck),
        hand: remove(state.players.player_2.hand),
        discard: remove(state.players.player_2.discard),
        inPlay: remove(state.players.player_2.inPlay),
        bases: remove(state.players.player_2.bases),
      },
    },
  };
}

export function moveCard(
  card: CardInstance,
  zone: Zone,
  state: GameState,
  toTop = false
): GameState {
  const updated: CardInstance = { ...card, currentZone: zone };
  let s = removeFromZone(card.instanceId, state);

  const push = (arr: CardInstance[]) =>
    toTop ? [updated, ...arr] : [...arr, updated];

  switch (zone) {
    case "trade_deck": return { ...s, tradeDeck: push(s.tradeDeck) };
    case "trade_row": return { ...s, tradeRow: push(s.tradeRow) };
    case "explorer_pile": return { ...s, explorerPile: push(s.explorerPile) };
    case "scrap_heap": return { ...s, scrapHeap: push(s.scrapHeap) };
    case "deck":
      return { ...s, players: { ...s.players, [card.ownerId!]: { ...s.players[card.ownerId! as PlayerId], deck: push(s.players[card.ownerId! as PlayerId].deck) } } };
    case "hand":
      return { ...s, players: { ...s.players, [card.ownerId!]: { ...s.players[card.ownerId! as PlayerId], hand: push(s.players[card.ownerId! as PlayerId].hand) } } };
    case "discard":
      return { ...s, players: { ...s.players, [card.ownerId!]: { ...s.players[card.ownerId! as PlayerId], discard: push(s.players[card.ownerId! as PlayerId].discard) } } };
    case "in_play":
      return { ...s, players: { ...s.players, [card.ownerId!]: { ...s.players[card.ownerId! as PlayerId], inPlay: push(s.players[card.ownerId! as PlayerId].inPlay) } } };
    case "bases":
      return { ...s, players: { ...s.players, [card.ownerId!]: { ...s.players[card.ownerId! as PlayerId], bases: push(s.players[card.ownerId! as PlayerId].bases) } } };
  }
}

export function addLog(state: GameState, playerId: PlayerId | null, message: string): GameState {
  return {
    ...state,
    log: [
      ...state.log,
      { turn: state.turnNumber, playerId, message, timestamp: Date.now() },
    ],
  };
}

export function clamp(n: number, min: number): number {
  return Math.max(min, n);
}
