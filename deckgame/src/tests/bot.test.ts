import { describe, it, expect } from "vitest";
import { runBotTurn, MAX_BOT_ACTIONS_PER_TURN } from "../game/bot";
import { setupGame, endTurn } from "../game/engine";
import { mkInstance } from "../game/utils";
import type { GameState, PendingChoice } from "../game/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBotState(overrides?: (s: GameState) => GameState): GameState {
  let state = setupGame({ player1Name: "Humain", player2Name: "Bot" });
  const r = endTurn(state, "player_1");
  if (!r.ok) throw new Error("endTurn failed during test setup");
  state = r.state;
  return overrides ? overrides(state) : state;
}

function withBotResources(state: GameState, trade: number, combat: number): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      player_2: { ...state.players.player_2, currentTrade: trade, currentCombat: combat },
    },
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("bot — constantes", () => {
  it("MAX_BOT_ACTIONS_PER_TURN vaut 200", () => {
    expect(MAX_BOT_ACTIONS_PER_TURN).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// runBotTurn — comportement général
// ---------------------------------------------------------------------------

describe("runBotTurn — comportement général", () => {
  it("renvoie ok:true et termine sans erreur", () => {
    const state = makeBotState();
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
  });

  it("le bot passe la main à player_1 (fin de tour)", () => {
    const state = makeBotState();
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.state.currentPlayerId).toBe("player_1");
  });

  it("actions inclut end_turn", () => {
    const state = makeBotState();
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("end_turn");
  });

  it("le bot joue les cartes de sa main", () => {
    const state = makeBotState();
    // player_2 has 5 cards drawn at setup
    expect(state.players.player_2.hand.length).toBe(5);
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    const playActions = result.actions.filter(a => a.startsWith("play:"));
    expect(playActions.length).toBeGreaterThan(0);
  });

  it("ne fait rien si ce n'est pas le tour du bot", () => {
    const state = setupGame(); // player_1's turn
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toHaveLength(0);
    expect(result.state).toBe(state); // state unchanged
  });

  it("ne fait rien si la partie est terminée", () => {
    const state = makeBotState(s => ({
      ...s,
      phase: "game_over" as const,
      winner: "player_1" as const,
      gameOverReason: "authority_depleted" as const,
    }));
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Achat
// ---------------------------------------------------------------------------

describe("runBotTurn — achat", () => {
  it("le bot achète la carte la plus chère abordable", () => {
    const cheapCard = mkInstance("blob_fighter", null, "trade_row"); // cost 1
    const expCard = mkInstance("battle_blob", null, "trade_row");   // cost 6
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [], currentTrade: 6, currentCombat: 0 },
      },
      tradeRow: [cheapCard, expCard],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    // battle_blob (cost 6) should be purchased, not blob_fighter (cost 1)
    expect(result.actions).toContain("buy:battle_blob");
    expect(result.actions).not.toContain("buy:blob_fighter");
  });

  it("le bot achète un Explorateur si rien d'autre n'est abordable", () => {
    const expensiveCard = mkInstance("battle_blob", null, "trade_row"); // cost 6
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [], currentTrade: 2, currentCombat: 0 },
      },
      tradeRow: [expensiveCard],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("buy:explorer");
  });
});

// ---------------------------------------------------------------------------
// Attaque
// ---------------------------------------------------------------------------

describe("runBotTurn — attaque", () => {
  it("le bot attaque l'adversaire directement si pas d'avant-poste", () => {
    const state = makeBotState(s => withBotResources({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [], currentTrade: 0, currentCombat: 5 },
        player_1: { ...s.players.player_1, bases: [] },
      },
    }, 0, 5));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions.some(a => a.startsWith("attack_opponent:"))).toBe(true);
  });

  it("le bot détruit un avant-poste avant d'attaquer directement", () => {
    const outpost = mkInstance("battle_station", "player_1", "bases"); // outpost, DEF 5
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [], currentTrade: 0, currentCombat: 10 },
        player_1: { ...s.players.player_1, bases: [{ ...outpost, exhausted: false }] },
      },
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("attack_base:battle_station");
    // After destroying the outpost, should also attack directly
    expect(result.actions.some(a => a.startsWith("attack_opponent:"))).toBe(true);
  });

  it("le bot n'attaque pas directement si un avant-poste est trop solide", () => {
    const outpost = mkInstance("brain_world", "player_1", "bases"); // outpost, DEF 6
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [], currentTrade: 0, currentCombat: 3 },
        player_1: { ...s.players.player_1, bases: [{ ...outpost, exhausted: false }] },
      },
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    // Can't destroy outpost (DEF 6 > 3 combat), so no direct attack either
    expect(result.actions.some(a => a.startsWith("attack_opponent:"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Résolution de choix
// ---------------------------------------------------------------------------

describe("runBotTurn — résolution de choix", () => {
  it("le bot résout un choix choose_one (option 0)", () => {
    // Option 0 gives +3 Commerce; we put a card costing 3 in the trade row
    // so the bot buys it after resolving — confirming option 0 was chosen.
    const buyableCard = mkInstance("trade_pod", null, "trade_row"); // cost 2
    const pendingChoice: PendingChoice = {
      id: "test-choose-one",
      type: "choose_one",
      playerId: "player_2",
      sourceCardInstanceId: "src-card",
      optional: false,
      options: [
        [{ type: "gain_trade", amount: 3 }],
        [{ type: "gain_combat", amount: 5 }],
      ],
    };
    const state = makeBotState(s => ({
      ...s,
      players: { ...s.players, player_2: { ...s.players.player_2, hand: [], currentTrade: 0 } },
      tradeRow: [buyableCard],
      pendingChoices: [pendingChoice],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("resolve:choose_one");
    // Bot gained +3 trade from option 0, enough to buy trade_pod (cost 2)
    const p2AllCards = [
      ...result.state.players.player_2.deck,
      ...result.state.players.player_2.discard,
    ];
    expect(p2AllCards.some(c => c.instanceId === buyableCard.instanceId)).toBe(true);
  });

  it("le bot résout un choix opponent_discard en défaussant sa carte la moins chère", () => {
    const scout = mkInstance("scout", "player_2", "hand");
    const expCard = mkInstance("blob_fighter", "player_2", "hand");
    const pendingChoice: PendingChoice = {
      id: "test-opp-discard",
      type: "opponent_discard",
      playerId: "player_2",
      sourceCardInstanceId: "src-card",
      optional: false,
      amount: 1,
      candidateIds: [scout.instanceId, expCard.instanceId],
    };
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [scout, expCard] },
      },
      pendingChoices: [pendingChoice],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("resolve:opponent_discard");
    // Scout (cost 0) is discarded, not blob_fighter (cost 1)
    const discard = result.state.players.player_2.discard;
    expect(discard.some(c => c.definitionId === "scout")).toBe(true);
  });

  it("le bot ignore un choix de récupération optionnel", () => {
    const cardInHand = mkInstance("scout", "player_2", "hand");
    const pendingChoice: PendingChoice = {
      id: "test-scrap-opt",
      type: "select_cards_to_scrap",
      playerId: "player_2",
      sourceCardInstanceId: "src-card",
      optional: true,
      amount: 1,
      candidateIds: [cardInHand.instanceId],
    };
    const state = makeBotState(s => ({
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: [cardInHand] },
      },
      pendingChoices: [pendingChoice],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("resolve:select_cards_to_scrap");
    // Card should NOT be scrapped (optional choice was skipped)
    const scrapped = result.state.scrapHeap.some(c => c.instanceId === cardInHand.instanceId);
    expect(scrapped).toBe(false);
  });

  it("le bot acquiert le vaisseau le plus cher lors d'un select_ship_to_acquire_free", () => {
    const cheapShip = mkInstance("blob_fighter", null, "trade_row"); // cost 1
    const expShip = mkInstance("battle_blob", null, "trade_row");    // cost 6
    const pendingChoice: PendingChoice = {
      id: "test-acquire-free",
      type: "select_ship_to_acquire_free",
      playerId: "player_2",
      sourceCardInstanceId: "src-card",
      optional: false,
      candidateIds: [cheapShip.instanceId, expShip.instanceId],
    };
    const state = makeBotState(s => ({
      ...s,
      players: { ...s.players, player_2: { ...s.players.player_2, hand: [] } },
      tradeRow: [cheapShip, expShip],
      pendingChoices: [pendingChoice],
    }));

    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions).toContain("resolve:select_ship_to_acquire_free");
    // battle_blob (cost 6) should be acquired
    const p2Cards = [
      ...result.state.players.player_2.deck,
      ...result.state.players.player_2.discard,
      ...result.state.players.player_2.hand,
    ];
    expect(p2Cards.some(c => c.definitionId === "battle_blob")).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// PATCH 0010 — Smoke tests jouabilite solo (humain vs bot)
// ---------------------------------------------------------------------------

import { playCard, resolvePendingChoice } from "../game/engine";
import type { ChoicePayload } from "../game/choices";
import { validateStateInvariants } from "../game/validators";

/** Simule le tour complet du joueur humain (player_1). */
function humanTurn(initial: GameState): GameState {
  let s = initial;
  for (let steps = 0; steps < 100; steps++) {
    const myChoice = s.pendingChoices.find(c => c.playerId === "player_1");
    if (myChoice) {
      let payload: ChoicePayload;
      if (myChoice.optional) {
        payload = { type: "skip" };
      } else if (myChoice.type === "choose_one") {
        payload = { type: "choose_one", optionIndex: 0 };
      } else {
        payload = { type: "select_cards", cardIds: myChoice.candidateIds?.slice(0, myChoice.amount ?? 1) ?? [] };
      }
      const r = resolvePendingChoice(s, "player_1", myChoice.id, payload);
      if (r.ok) { s = r.state; continue; }
    }
    const noPending = !s.pendingChoices.some(c => c.playerId === "player_1");
    if (s.players.player_1.hand.length > 0 && noPending) {
      const card = s.players.player_1.hand[0];
      const r = playCard(s, "player_1", card.instanceId);
      if (r.ok) { s = r.state; continue; }
    }
    const r = endTurn(s, "player_1");
    if (r.ok) s = r.state;
    break;
  }
  return s;
}

describe("smoke test â jouabilite solo humain vs bot (PATCH 0010)", () => {
  it("les invariants tiennent a chaque tour et la partie se termine", () => {
    let state = setupGame({ player1Name: "Humain", player2Name: "Bot" });
    let turns = 0;
    const MAX_TURNS = 200;

    while (state.phase !== "game_over" && turns < MAX_TURNS) {
      turns++;
      expect(validateStateInvariants(state)).toEqual([]);

      if (state.currentPlayerId === "player_1") {
        state = humanTurn(state);
      } else {
        const result = runBotTurn(state, "player_2");
        expect(result.ok).toBe(true);
        state = result.state;
      }
    }

    if (state.phase === "game_over") {
      expect(state.winner).not.toBeNull();
      expect(validateStateInvariants(state)).toEqual([]);
    } else {
      expect(turns).toBeLessThan(MAX_TURNS);
    }
  });

  it("le bot rend la main au joueur humain apres son tour (3 cycles)", () => {
    let state = setupGame({ player1Name: "Humain", player2Name: "Bot" });

    for (let i = 0; i < 3 && state.phase !== "game_over"; i++) {
      expect(state.currentPlayerId).toBe("player_1");
      state = humanTurn(state);
      if (state.phase === "game_over") break;

      expect(state.currentPlayerId).toBe("player_2");
      const result = runBotTurn(state, "player_2");
      expect(result.ok).toBe(true);
      state = result.state;

      if (state.phase !== "game_over") {
        expect(state.currentPlayerId).toBe("player_1");
      }
    }
  });

  it("MAX_BOT_ACTIONS_PER_TURN protege contre les boucles infinies", () => {
    let state = setupGame({ player1Name: "Humain", player2Name: "Bot" });
    const r0 = endTurn(state, "player_1");
    expect(r0.ok).toBe(true);
    if (!r0.ok) return;
    state = {
      ...r0.state,
      players: {
        ...r0.state.players,
        player_2: { ...r0.state.players.player_2, currentTrade: 100, currentCombat: 200 },
      },
    };
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    expect(result.actions.length).toBeLessThanOrEqual(MAX_BOT_ACTIONS_PER_TURN);
    expect(validateStateInvariants(result.state)).toEqual([]);
  });

  it("partie complete bot vs bot atteint game_over proprement", () => {
    let state = setupGame({ player1Name: "BotA", player2Name: "BotB" });
    let turns = 0;
    const MAX_TURNS = 300;

    while (state.phase !== "game_over" && turns < MAX_TURNS) {
      turns++;
      const pid = state.currentPlayerId;
      const result = runBotTurn(state, pid);
      expect(result.ok).toBe(true);
      state = result.state;
    }

    if (state.phase === "game_over") {
      expect(state.winner).not.toBeNull();
      expect(validateStateInvariants(state)).toEqual([]);
    } else {
      expect(turns).toBeLessThan(MAX_TURNS);
    }
  });
});


// ---------------------------------------------------------------------------
// PATCH 0012 — Verrouillage des interactions humaines pendant le tour bot
// ---------------------------------------------------------------------------

import {
  playCard as _playCard,
  attackOpponent as _attackOpponent,
  buyTradeRowCard as _buyTradeRowCard,
  endTurn as _endTurn,
} from "../game/engine";

describe("verrouillage interactions humaines pendant le tour bot (PATCH 0012)", () => {
  /**
   * Pendant le tour du bot (player_2), le moteur refuse toute action de player_1
   * via le mécanisme existant not_your_turn. Ce test prouve que le moteur est le
   * garant ultime de l isolation des tours, indépendamment des vérifications UI.
   */

  function makeBotActiveState(): GameState {
    const state = setupGame({ player1Name: "Humain", player2Name: "Bot" });
    const r = endTurn(state, "player_1");
    if (!r.ok) throw new Error("endTurn p1 failed");
    return r.state; // currentPlayerId === "player_2"
  }

  it("playCard par player_1 pendant le tour bot retourne not_your_turn", () => {
    const state = makeBotActiveState();
    expect(state.currentPlayerId).toBe("player_2");
    const card = state.players.player_1.hand[0];
    const r = _playCard(state, "player_1", card.instanceId);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("not_your_turn");
      // Le GameState est inchangé
      expect(r.state).toBe(state);
    }
  });

  it("attackOpponent par player_1 pendant le tour bot retourne not_your_turn", () => {
    const state = makeBotActiveState();
    const withCombat = { ...state, players: { ...state.players, player_1: { ...state.players.player_1, currentCombat: 5 } } };
    const r = _attackOpponent(withCombat, "player_1", 5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("not_your_turn");
      expect(r.state.players.player_2.authority).toBe(50);
    }
  });

  it("buyTradeRowCard par player_1 pendant le tour bot retourne not_your_turn", () => {
    const state = makeBotActiveState();
    const withTrade = { ...state, players: { ...state.players, player_1: { ...state.players.player_1, currentTrade: 10 } } };
    const card = withTrade.tradeRow[0];
    const r = _buyTradeRowCard(withTrade, "player_1", card.instanceId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("not_your_turn");
  });

  it("endTurn par player_1 pendant le tour bot retourne not_your_turn", () => {
    const state = makeBotActiveState();
    const r = _endTurn(state, "player_1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("not_your_turn");
      expect(r.state).toBe(state);
    }
  });

  it("le bot termine toujours son tour sans laisser de choix non resolus pour player_2", () => {
    const state = makeBotActiveState();
    const result = runBotTurn(state, "player_2");
    expect(result.ok).toBe(true);
    // Après le tour bot, aucun choix en attente pour player_2
    const botChoices = result.state.pendingChoices.filter(c => c.playerId === "player_2");
    expect(botChoices).toHaveLength(0);
    // Et c'est maintenant le tour de player_1
    if (result.state.phase !== "game_over") {
      expect(result.state.currentPlayerId).toBe("player_1");
    }
  });
});
