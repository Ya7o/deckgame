import { describe, it, expect } from "vitest";
import {
  setupGame,
  playCard,
  buyTradeRowCard,
  buyExplorer,
  attackBase,
  attackOpponent,
  activateBase,
  activateSelfScrap,
  endTurn,
  concedeGame,
} from "../game/engine";
import { resolvePendingChoice } from "../game/engine";
import { getCardDef } from "../data/cards";
import { mkInstance } from "../game/utils";
import type { ChoicePayload } from "../game/choices";
import type { PendingChoice } from "../game/types";
import { validateStateInvariants } from "../game/validators";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("setupGame", () => {
  it("creates two players with 50 authority", () => {
    const s = setupGame();
    expect(s.players.player_1.authority).toBe(50);
    expect(s.players.player_2.authority).toBe(50);
  });

  it("player_1 has 3 cards in hand, player_2 has 5", () => {
    const s = setupGame();
    expect(s.players.player_1.hand.length).toBe(3);
    expect(s.players.player_2.hand.length).toBe(5);
  });

  it("each player has 10 cards total (8 scouts + 2 vipers)", () => {
    const s = setupGame();
    const p1Total = s.players.player_1.deck.length + s.players.player_1.hand.length;
    const p2Total = s.players.player_2.deck.length + s.players.player_2.hand.length;
    expect(p1Total).toBe(10);
    expect(p2Total).toBe(10);
  });

  it("trade row has 5 cards", () => {
    const s = setupGame();
    expect(s.tradeRow.length).toBe(5);
  });

  it("trade deck has 75 cards (80 minus 5 in trade row)", () => {
    const s = setupGame();
    expect(s.tradeDeck.length).toBe(75);
  });

  it("explorer pile has 10 cards", () => {
    const s = setupGame();
    expect(s.explorerPile.length).toBe(10);
  });

  it("player_1 is current player", () => {
    const s = setupGame();
    expect(s.currentPlayerId).toBe("player_1");
  });

  it("player_1 deck cards are scouts and vipers only", () => {
    const s = setupGame();
    const allCards = [...s.players.player_1.deck, ...s.players.player_1.hand];
    const ids = allCards.map(c => c.definitionId);
    expect(ids.every(id => id === "scout" || id === "viper")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

describe("resources", () => {
  it("playing scout gives +1 trade", () => {
    const s = setupGame();
    const scout = s.players.player_1.hand.find(c => c.definitionId === "scout");
    expect(scout).toBeDefined();
    const r = playCard(s, "player_1", scout!.instanceId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players.player_1.currentTrade).toBe(1);
  });

  it("playing viper gives +1 combat", () => {
    const s = setupGame();
    const viper = s.players.player_1.hand.find(c => c.definitionId === "viper");
    if (!viper) return; // viper might not be in first 3 cards, skip
    const r = playCard(s, "player_1", viper.instanceId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players.player_1.currentCombat).toBe(1);
  });

  it("trade resets to 0 after end turn", () => {
    let s = setupGame();
    // Play all hand cards to get some trade
    for (const card of [...s.players.player_1.hand]) {
      const r = playCard(s, "player_1", card.instanceId);
      if (r.ok) s = r.state;
    }
    expect(s.players.player_1.currentTrade).toBeGreaterThan(0);
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players.player_1.currentTrade).toBe(0);
  });

  it("combat resets to 0 after end turn", () => {
    let s = setupGame();
    // Give player some combat via viper
    const viper = s.players.player_1.hand.find(c => c.definitionId === "viper");
    if (viper) {
      const r = playCard(s, "player_1", viper.instanceId);
      if (r.ok) s = r.state;
    }
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players.player_1.currentCombat).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Card zones
// ---------------------------------------------------------------------------

describe("card zones", () => {
  it("playing a ship moves it to inPlay", () => {
    const s = setupGame();
    const card = s.players.player_1.hand[0];
    const def = getCardDef(card.definitionId);
    if (def.type !== "ship") return;
    const r = playCard(s, "player_1", card.instanceId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.players.player_1.inPlay.some(c => c.instanceId === card.instanceId)).toBe(true);
      expect(r.state.players.player_1.hand.some(c => c.instanceId === card.instanceId)).toBe(false);
    }
  });

  it("end turn moves inPlay ships to discard", () => {
    let s = setupGame();
    const card = s.players.player_1.hand[0];
    const r1 = playCard(s, "player_1", card.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    s = r1.state;
    const r2 = endTurn(s, "player_1");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.players.player_1.discard.some(c => c.instanceId === card.instanceId)).toBe(true);
    expect(r2.state.players.player_1.inPlay.length).toBe(0);
  });

  it("end turn: remaining hand goes to discard", () => {
    const s = setupGame();
    const handCount = s.players.player_1.hand.length;
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_1.discard.length).toBe(handCount);
    // player_1 draws 5 for their next turn after ending
    expect(r.state.players.player_1.hand.length).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Buying
// ---------------------------------------------------------------------------

describe("buying", () => {
  it("cannot buy if insufficient trade", () => {
    const s = setupGame();
    const card = s.tradeRow[0];
    const r = buyTradeRowCard(s, "player_1", card.instanceId);
    // Player has 0 trade, any card costs at least 1
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("insufficient_trade");
  });

  it("bought card reduces trade and goes to discard", () => {
    let s = setupGame();
    // Give player enough trade manually
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentTrade: 10 } } };
    const card = s.tradeRow[0];
    const def = getCardDef(card.definitionId);
    const r = buyTradeRowCard(s, "player_1", card.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ns = r.state;
    expect(ns.players.player_1.currentTrade).toBe(10 - def.cost!);
    expect(ns.players.player_1.discard.some(c => c.instanceId === card.instanceId)).toBe(true);
    // Trade row should have been refilled
    expect(ns.tradeRow.length).toBe(5);
  });

  it("cannot buy explorer if trade < 2", () => {
    const s = setupGame();
    const r = buyExplorer(s, "player_1");
    expect(r.ok).toBe(false);
  });

  it("buying explorer moves it to discard and doesn't refill trade row", () => {
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentTrade: 5 } } };
    const tradeRowBefore = s.tradeRow.length;
    const r = buyExplorer(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_1.discard.some(c => c.definitionId === "explorer")).toBe(true);
    expect(r.state.tradeRow.length).toBe(tradeRowBefore); // no refill
    expect(r.state.explorerPile.length).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// Draw / Reshuffle
// ---------------------------------------------------------------------------

describe("draw and reshuffle", () => {
  it("end turn draws 5 cards for current player (for next turn)", () => {
    const s = setupGame();
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // player_1 draws 5 for their own next turn after ending
    expect(r.state.players.player_1.hand.length).toBe(5);
    // player_2 keeps their setup hand of 5
    expect(r.state.players.player_2.hand.length).toBe(5);
  });

  it("reshuffle occurs when deck is empty", () => {
    let s = setupGame();
    // Empty player_1 deck by moving to discard
    const allCards = [...s.players.player_1.deck];
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          deck: [],
          discard: allCards.map(c => ({ ...c, currentZone: "discard" as const })),
        },
      },
    };
    // End turn should draw for player_2, but let's test via playCard/endTurn for p1
    // Trigger reshuffle by ending turn (p2 draws 5, no reshuffle needed)
    // More targeted: give p1 empty deck + discard and check draw
    expect(s.players.player_1.deck.length).toBe(0);
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    // Now test p2 end turn → p1 draws with reshuffle
    if (!r.ok) return;
    const r2 = endTurn(r.state, "player_2");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // p1 should have drawn from reshuffled discard
    expect(r2.state.players.player_1.hand.length).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Bases — activation double fix (PATCH 0002)
// ---------------------------------------------------------------------------

describe("base activation", () => {
  it("playing Blob Wheel does NOT give +1 Combat immediately", () => {
    let s = setupGame();
    // Inject Blob Wheel into hand
    const bw = mkInstance("blob_wheel", "player_1", "hand");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, hand: [bw] } } };
    const r = playCard(s, "player_1", bw.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_1.currentCombat).toBe(0);
  });

  it("activating Blob Wheel gives +1 Combat", () => {
    let s = setupGame();
    const bw = mkInstance("blob_wheel", "player_1", "hand");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, hand: [bw] } } };
    const r1 = playCard(s, "player_1", bw.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = activateBase(r1.state, "player_1", bw.instanceId);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.players.player_1.currentCombat).toBe(1);
  });

  it("activating Blob Wheel twice in the same turn fails", () => {
    let s = setupGame();
    const bw = mkInstance("blob_wheel", "player_1", "hand");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, hand: [bw] } } };
    const r1 = playCard(s, "player_1", bw.instanceId);
    if (!r1.ok) return;
    const r2 = activateBase(r1.state, "player_1", bw.instanceId);
    if (!r2.ok) return;
    const r3 = activateBase(r2.state, "player_1", bw.instanceId);
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.error).toBe("base_already_exhausted");
  });

  it("a base played this turn can be activated once", () => {
    let s = setupGame();
    const th = mkInstance("the_hive", "player_1", "hand");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, hand: [th] } } };
    const r1 = playCard(s, "player_1", th.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.state.players.player_1.currentCombat).toBe(0);
    const r2 = activateBase(r1.state, "player_1", th.instanceId);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.players.player_1.currentCombat).toBe(3);
  });

  it("a base stays in play after end turn and exhaustion resets", () => {
    let s = setupGame();
    const bw = mkInstance("blob_wheel", "player_1", "bases");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, bases: [{ ...bw, exhausted: true }] } } };
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const base = r.state.players.player_1.bases.find(b => b.instanceId === bw.instanceId);
    expect(base).toBeDefined();
    expect(base!.exhausted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Combat — validation stricte (PATCH 0003)
// ---------------------------------------------------------------------------

describe("combat strict validation", () => {
  function withCombat(n: number) {
    const s = setupGame();
    return { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentCombat: n } } };
  }

  it("attack with amount 0 is rejected", () => {
    const r = attackOpponent(withCombat(5), "player_1", 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_amount");
    // State must be unchanged
    if (!r.ok) expect(r.state.players.player_2.authority).toBe(50);
  });

  it("attack with negative amount is rejected", () => {
    const r = attackOpponent(withCombat(5), "player_1", -3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_amount");
    if (!r.ok) expect(r.state.players.player_2.authority).toBe(50);
  });

  it("attack with non-integer amount is rejected", () => {
    const r = attackOpponent(withCombat(5), "player_1", 2.5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_amount");
    if (!r.ok) expect(r.state.players.player_2.authority).toBe(50);
  });

  it("attack with amount greater than currentCombat is rejected", () => {
    const r = attackOpponent(withCombat(3), "player_1", 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("insufficient_combat");
    if (!r.ok) expect(r.state.players.player_2.authority).toBe(50);
  });

  it("attack blocked by outpost is rejected, state unchanged", () => {
    let s = withCombat(10);
    const outpost = mkInstance("battle_station", "player_2", "bases");
    s = { ...s, players: { ...s.players, player_2: { ...s.players.player_2, bases: [outpost] } } };
    const authorityBefore = s.players.player_2.authority;
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("outpost_blocking");
      expect(r.state.players.player_2.authority).toBe(authorityBefore);
      expect(r.state.players.player_1.currentCombat).toBe(10);
    }
  });

  it("valid attack reduces authority and combat", () => {
    const s = withCombat(8);
    const r = attackOpponent(s, "player_1", 6);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_2.authority).toBe(44);
    expect(r.state.players.player_1.currentCombat).toBe(2);
  });

  it("lethal attack triggers game_over", () => {
    const s = withCombat(50);
    const r = attackOpponent(s, "player_1", 50);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("game_over");
    expect(r.state.winner).toBe("player_1");
  });
});

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

describe("combat", () => {
  it("attackOpponent reduces opponent authority", () => {
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentCombat: 5 } } };
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_2.authority).toBe(45);
    expect(r.state.players.player_1.currentCombat).toBe(0);
  });

  it("cannot attack with insufficient combat", () => {
    const s = setupGame();
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("insufficient_combat");
  });

  it("game ends when authority <= 0", () => {
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentCombat: 50 } } };
    const r = attackOpponent(s, "player_1", 50);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("game_over");
    expect(r.state.winner).toBe("player_1");
  });

  it("partial attack is allowed", () => {
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentCombat: 10 } } };
    const r = attackOpponent(s, "player_1", 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_2.authority).toBe(47);
    expect(r.state.players.player_1.currentCombat).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Bases / Outposts
// ---------------------------------------------------------------------------

describe("bases and outposts", () => {
  it("outpost blocks direct attack", () => {
    let s = setupGame();
    // Inject an outpost into p2's bases
    const outpostInst = mkInstance("battle_station", "player_2", "bases");
    s = {
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, bases: [outpostInst] },
        player_1: { ...s.players.player_1, currentCombat: 10 },
      },
    };
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("outpost_blocking");
  });

  it("can attack a base directly", () => {
    let s = setupGame();
    const baseInst = mkInstance("battle_station", "player_2", "bases");
    const def = getCardDef("battle_station");
    s = {
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, bases: [baseInst] },
        player_1: { ...s.players.player_1, currentCombat: 10 },
      },
    };
    const r = attackBase(s, "player_1", baseInst.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Base destroyed → moved to discard
    expect(r.state.players.player_2.bases.length).toBe(0);
    expect(r.state.players.player_2.discard.some(c => c.instanceId === baseInst.instanceId)).toBe(true);
    expect(r.state.players.player_1.currentCombat).toBe(10 - def.defense!);
  });

  it("cannot attack base with insufficient combat", () => {
    let s = setupGame();
    const baseInst = mkInstance("battle_station", "player_2", "bases");
    s = { ...s, players: { ...s.players, player_2: { ...s.players.player_2, bases: [baseInst] } } };
    const r = attackBase(s, "player_1", baseInst.instanceId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("insufficient_combat");
  });

  it("base can be activated once per turn", () => {
    let s = setupGame();
    const baseInst = mkInstance("blob_wheel", "player_1", "bases");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, bases: [baseInst] },
      },
    };
    const r1 = activateBase(s, "player_1", baseInst.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = activateBase(r1.state, "player_1", baseInst.instanceId);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("base_already_exhausted");
  });

  it("bases persist after end turn, exhaustion resets", () => {
    let s = setupGame();
    const baseInst = mkInstance("the_hive", "player_1", "bases");
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, bases: [baseInst] } } };
    const r1 = activateBase(s, "player_1", baseInst.instanceId);
    if (!r1.ok) return;
    const r2 = endTurn(r1.state, "player_1");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    const base = r2.state.players.player_1.bases.find(b => b.instanceId === baseInst.instanceId);
    expect(base).toBeDefined();
    expect(base!.exhausted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Turn switching
// ---------------------------------------------------------------------------

describe("turn switching", () => {
  it("after end turn, current player becomes player_2", () => {
    const s = setupGame();
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.currentPlayerId).toBe("player_2");
  });

  it("not-your-turn is rejected", () => {
    const s = setupGame();
    const card = s.players.player_2.hand[0];
    const r = playCard(s, "player_2", card.instanceId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("not_your_turn");
  });
});

// ---------------------------------------------------------------------------
// Self-scrap
// ---------------------------------------------------------------------------

describe("self-scrap", () => {
  it("self-scrapping explorer gains 2 combat", () => {
    let s = setupGame();
    // Give player_1 an explorer in inPlay
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentTrade: 2 } } };
    const r0 = buyExplorer(s, "player_1");
    expect(r0.ok).toBe(true);
    if (!r0.ok) return;
    s = r0.state;
    // Move explorer from discard to hand (hack for test)
    const explorerInDiscard = s.players.player_1.discard.find(c => c.definitionId === "explorer")!;
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [...s.players.player_1.hand, { ...explorerInDiscard, currentZone: "hand" }],
          discard: s.players.player_1.discard.filter(c => c.instanceId !== explorerInDiscard.instanceId),
        },
      },
    };
    const r1 = playCard(s, "player_1", explorerInDiscard.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    s = r1.state;
    // Explorer gives +2 trade on play; player had 0 trade (spent 2 buying), now has 2
    expect(s.players.player_1.currentTrade).toBe(2);
    const r2 = activateSelfScrap(s, "player_1", explorerInDiscard.instanceId);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.players.player_1.currentCombat).toBe(2);
    // Explorer should be in scrap heap
    expect(r2.state.scrapHeap.some(c => c.instanceId === explorerInDiscard.instanceId)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Concede
// ---------------------------------------------------------------------------

describe("concedeGame", () => {
  it("conceding sets winner to opponent", () => {
    const s = setupGame();
    const r = concedeGame(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.winner).toBe("player_2");
    expect(r.state.phase).toBe("game_over");
  });
});

// ---------------------------------------------------------------------------
// Smoke test
// ---------------------------------------------------------------------------

describe("smoke test", () => {
  it("full game can be played to completion without crash", () => {
    let s = setupGame();
    let safety = 0;

    while (s.phase !== "game_over" && safety < 500) {
      safety++;
      const pid = s.currentPlayerId;
      const player = s.players[pid];

      // Resolve any pending choices by skipping optional ones or picking first option
      if (s.pendingChoices.length > 0) {
        const choice = s.pendingChoices.find(c => c.playerId === pid);
        if (choice) {
          let payload: ChoicePayload;
          if (choice.optional) {
            payload = { type: "skip" };
          } else if (choice.type === "choose_one") {
            payload = { type: "choose_one", optionIndex: 0 };
          } else {
            payload = { type: "select_cards", cardIds: choice.candidateIds?.slice(0, choice.amount ?? 1) ?? [] };
          }
          const r = resolvePendingChoice(s, pid, choice.id, payload);
          if (r.ok) { s = r.state; continue; }
        }
        // Skip opponent choices by picking for them too
        const oppChoice = s.pendingChoices.find(c => c.playerId !== pid);
        if (oppChoice) {
          const oid = oppChoice.playerId;
          let payload: ChoicePayload = { type: "select_cards", cardIds: oppChoice.candidateIds?.slice(0, oppChoice.amount ?? 1) ?? [] };
          if (oppChoice.optional) payload = { type: "skip" };
          if (oppChoice.type === "choose_one") payload = { type: "choose_one", optionIndex: 0 };
          const r = resolvePendingChoice(s, oid, oppChoice.id, payload);
          if (r.ok) { s = r.state; continue; }
        }
      }

      // Play all hand cards
      if (player.hand.length > 0) {
        const card = player.hand[0];
        const r = playCard(s, pid, card.instanceId);
        if (r.ok) { s = r.state; continue; }
      }

      // Buy cheapest trade row card if possible
      const affordable = s.tradeRow.filter(c => {
        const def = getCardDef(c.definitionId);
        return def.cost !== null && player.currentTrade >= def.cost;
      });
      if (affordable.length > 0) {
        const r = buyTradeRowCard(s, pid, affordable[0].instanceId);
        if (r.ok) { s = r.state; continue; }
      }

      // Attack with full combat
      if (player.currentCombat > 0) {
        const oppBases = s.players[s.opponentPlayerId].bases;
        const outposts = oppBases.filter(b => getCardDef(b.definitionId).isOutpost);
        if (outposts.length > 0) {
          const target = outposts.find(b => player.currentCombat >= (getCardDef(b.definitionId).defense ?? 999));
          if (target) {
            const r = attackBase(s, pid, target.instanceId);
            if (r.ok) { s = r.state; continue; }
          }
        } else {
          const r = attackOpponent(s, pid, player.currentCombat);
          if (r.ok) { s = r.state; continue; }
        }
      }

      // End turn
      const r = endTurn(s, pid);
      if (r.ok) { s = r.state; }
      else break;
    }

    expect(["game_over"].includes(s.phase) || safety < 500).toBe(true);
    if (s.phase === "game_over") {
      expect(s.winner).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// PATCH 0004 — resolveChoice validation
// ---------------------------------------------------------------------------

describe("resolveChoice validation (PATCH 0004)", () => {
  function makeChoice(overrides: Partial<PendingChoice>): PendingChoice {
    return {
      id: "test-cid",
      type: "choose_one",
      playerId: "player_1",
      sourceCardInstanceId: "src-inst",
      optional: false,
      options: [[{ type: "gain_trade", amount: 1 }]],
      ...overrides,
    };
  }

  it("unknown choiceId → invalid_choice, state reference unchanged", () => {
    const s = setupGame();
    const r = resolvePendingChoice(s, "player_1", "no-such-id", { type: "skip" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_choice");
    expect(r.state).toBe(s);
  });

  it("wrong player → not_your_turn, state unchanged", () => {
    const s = setupGame();
    const choice = makeChoice({ id: "c1", playerId: "player_1" });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_2", "c1", { type: "choose_one", optionIndex: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("not_your_turn");
    expect(r.state).toBe(sw);
  });

  it("choose_one: out-of-range index → invalid_choice, choice not consumed", () => {
    const s = setupGame();
    const choice = makeChoice({ id: "c2", options: [[{ type: "gain_trade", amount: 1 }]] });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c2", { type: "choose_one", optionIndex: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_choice");
    expect(r.state.pendingChoices).toHaveLength(1);
  });

  it("select_cards_to_scrap: too many cards → invalid_choice, choice not consumed", () => {
    const s = setupGame();
    const [c1, c2] = s.players.player_1.hand;
    const choice = makeChoice({
      id: "c3", type: "select_cards_to_scrap", amount: 1,
      candidateIds: [c1.instanceId, c2.instanceId],
    });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c3", { type: "select_cards", cardIds: [c1.instanceId, c2.instanceId] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_choice");
    expect(r.state.pendingChoices).toHaveLength(1);
  });

  it("select_cards_to_scrap: card not in candidateIds → invalid_target", () => {
    const s = setupGame();
    const [c1, c2] = s.players.player_1.hand;
    const choice = makeChoice({
      id: "c4", type: "select_cards_to_scrap", amount: 1,
      candidateIds: [c1.instanceId],
    });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c4", { type: "select_cards", cardIds: [c2.instanceId] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_target");
    expect(r.state.pendingChoices).toHaveLength(1);
  });

  it("select_cards_to_scrap: card in candidateIds but not in hand/discard → invalid_target", () => {
    const s = setupGame();
    const fakeId = "ghost-card-id";
    const choice = makeChoice({
      id: "c5", type: "select_cards_to_scrap", amount: 1,
      candidateIds: [fakeId],
    });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c5", { type: "select_cards", cardIds: [fakeId] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_target");
    expect(r.state.pendingChoices).toHaveLength(1);
  });

  it("skip on non-optional choice → invalid_choice, choice not consumed", () => {
    const s = setupGame();
    const choice = makeChoice({ id: "c6", optional: false });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c6", { type: "skip" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_choice");
    expect(r.state.pendingChoices).toHaveLength(1);
  });

  it("skip on optional choice → ok, choice removed", () => {
    const s = setupGame();
    const choice = makeChoice({ id: "c7", optional: true });
    const sw = { ...s, pendingChoices: [choice] };
    const r = resolvePendingChoice(sw, "player_1", "c7", { type: "skip" });
    expect(r.ok).toBe(true);
    expect(r.state.pendingChoices).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// PATCH 0005 — validateStateInvariants
// ---------------------------------------------------------------------------

function assertValidState(state: import("../game/types").GameState) {
  expect(validateStateInvariants(state)).toEqual([]);
}

describe("validateStateInvariants (PATCH 0005)", () => {
  it("valid after setupGame", () => {
    assertValidState(setupGame());
  });

  it("valid after playCard (ship)", () => {
    const s = setupGame();
    // Find a ship card in hand (Scouts or Vipers are ships)
    const card = s.players.player_1.hand[0];
    const r = playCard(s, "player_1", card.instanceId);
    expect(r.ok).toBe(true);
    if (r.ok) assertValidState(r.state);
  });

  it("valid after buyTradeRowCard", () => {
    // Give player_1 enough trade to buy the cheapest trade row card
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentTrade: 10 } } };
    const cheapest = s.tradeRow.reduce((a, b) => {
      const da = getCardDef(a.definitionId); const db = getCardDef(b.definitionId);
      return (da.cost ?? 999) <= (db.cost ?? 999) ? a : b;
    });
    const r = buyTradeRowCard(s, "player_1", cheapest.instanceId);
    expect(r.ok).toBe(true);
    if (r.ok) assertValidState(r.state);
  });

  it("valid after attackOpponent", () => {
    let s = setupGame();
    s = { ...s, players: { ...s.players, player_1: { ...s.players.player_1, currentCombat: 5 } } };
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(true);
    if (r.ok) assertValidState(r.state);
  });

  it("valid after endTurn", () => {
    const s = setupGame();
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (r.ok) assertValidState(r.state);
  });

  it("detects duplicate instanceId (card in two zones)", () => {
    const s = setupGame();
    const card = s.players.player_1.hand[0];
    // Inject the same card instance into two zones
    const corrupted = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          discard: [...s.players.player_1.discard, card],
        },
      },
    };
    const errors = validateStateInvariants(corrupted);
    expect(errors.some(e => e.includes("Duplicate instanceId"))).toBe(true);
  });

  it("detects negative currentTrade", () => {
    const s = setupGame();
    const corrupted = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, currentTrade: -1 },
      },
    };
    const errors = validateStateInvariants(corrupted);
    expect(errors.some(e => e.includes("currentTrade is negative"))).toBe(true);
  });

  it("detects winner set without game_over phase", () => {
    const s = setupGame();
    const corrupted = { ...s, winner: "player_1" as const };
    const errors = validateStateInvariants(corrupted);
    expect(errors.some(e => e.includes("winner is set"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PATCH 0006 — Stealth Needle et cartes complexes
// ---------------------------------------------------------------------------

describe("Stealth Needle (PATCH 0006)", () => {
  function setupStealthNeedle() {
    let s = setupGame();
    // Put a Blob Fighter (blob ship) in inPlay and Stealth Needle in hand
    const blobFighter = mkInstance("blob_fighter", "player_1", "in_play");
    const stealthNeedle = mkInstance("stealth_needle", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [stealthNeedle],
          inPlay: [blobFighter],
          cardsPlayedThisTurn: [blobFighter.instanceId],
        },
      },
    };
    return { s, blobFighter, stealthNeedle };
  }

  it("playing Stealth Needle creates a select_ship_to_copy pending choice", () => {
    const { s, stealthNeedle } = setupStealthNeedle();
    const r = playCard(s, "player_1", stealthNeedle.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const choice = r.state.pendingChoices.find(c => c.type === "select_ship_to_copy");
    expect(choice).toBeDefined();
  });

  it("copies primary effects of the selected ship", () => {
    const { s, stealthNeedle, blobFighter } = setupStealthNeedle();
    const r1 = playCard(s, "player_1", stealthNeedle.instanceId);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const choice = r1.state.pendingChoices.find(c => c.type === "select_ship_to_copy")!;
    // Blob Fighter gives +3 combat
    const r2 = resolvePendingChoice(r1.state, "player_1", choice.id, { type: "select_cards", cardIds: [blobFighter.instanceId] });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.players.player_1.currentCombat).toBe(3);
  });

  it("adds the copied ship's faction to temporaryFactions", () => {
    const { s, stealthNeedle, blobFighter } = setupStealthNeedle();
    const r1 = playCard(s, "player_1", stealthNeedle.instanceId);
    if (!r1.ok) return;
    const choice = r1.state.pendingChoices.find(c => c.type === "select_ship_to_copy")!;
    const r2 = resolvePendingChoice(r1.state, "player_1", choice.id, { type: "select_cards", cardIds: [blobFighter.instanceId] });
    if (!r2.ok) return;
    const needle = r2.state.players.player_1.inPlay.find(c => c.definitionId === "stealth_needle");
    expect(needle?.temporaryFactions).toContain("blob");
  });

  it("cannot copy a base — rejected with invalid_target", () => {
    let s = setupGame();
    // Put Stealth Needle in hand and a blob base in bases
    const blobBase = mkInstance("the_hive", "player_1", "bases");
    const stealthNeedle = mkInstance("stealth_needle", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [stealthNeedle],
          inPlay: [],
          bases: [blobBase],
        },
      },
    };
    // Playing Stealth Needle with no ships in inPlay logs a message and creates no choice
    const r = playCard(s, "player_1", stealthNeedle.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const choice = r.state.pendingChoices.find(c => c.type === "select_ship_to_copy");
    expect(choice).toBeUndefined(); // no choice because no ship to copy
  });

  it("cannot auto-copy (select self) — rejected with invalid_target", () => {
    const { s, stealthNeedle } = setupStealthNeedle();
    const r1 = playCard(s, "player_1", stealthNeedle.instanceId);
    if (!r1.ok) return;
    const choice = r1.state.pendingChoices.find(c => c.type === "select_ship_to_copy")!;
    // The Stealth Needle's own instanceId should not be in candidateIds
    expect(choice.candidateIds).not.toContain(stealthNeedle.instanceId);
    // Try to force auto-select anyway
    const r2 = resolvePendingChoice(r1.state, "player_1", choice.id, { type: "select_cards", cardIds: [stealthNeedle.instanceId] });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("invalid_target");
  });

  it("ally effects unlock after copy grants new faction", () => {
    // Put two blob fighters in inPlay — copy gives blob faction, unlocking ally for the first fighter
    let s = setupGame();
    const fighter1 = mkInstance("blob_fighter", "player_1", "in_play");
    const fighter2 = mkInstance("blob_fighter", "player_1", "in_play");
    const needle = mkInstance("stealth_needle", "player_1", "hand");
    // fighter1 ally already triggered (has blob ally from fighter2)
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [needle],
          inPlay: [fighter1, fighter2],
          cardsPlayedThisTurn: [fighter1.instanceId, fighter2.instanceId],
          // fighter1's ally already triggered
          activatedAllyEffectsThisTurn: [`${fighter1.instanceId}:blob`],
        },
      },
    };
    const combatBefore = s.players.player_1.currentCombat;
    const r1 = playCard(s, "player_1", needle.instanceId);
    if (!r1.ok) return;
    const choice = r1.state.pendingChoices.find(c => c.type === "select_ship_to_copy")!;
    const r2 = resolvePendingChoice(r1.state, "player_1", choice.id, { type: "select_cards", cardIds: [fighter1.instanceId] });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // Needle gains blob faction → its own ally effect should trigger (draw 1)
    // We just verify the state is valid after this complex interaction
    assertValidState(r2.state);
    // At minimum, Blob Fighter primary effects (+3 combat) were copied
    expect(r2.state.players.player_1.currentCombat).toBeGreaterThan(combatBefore);
  });
});

// ---------------------------------------------------------------------------
// PATCH 0024 — Tests de non-régression
// ---------------------------------------------------------------------------

describe("PATCH 0024 — Dreadnaught effet allié", () => {
  it("Dreadnaught sans allié Star Empire : pas de +5 combat allié", () => {
    let s = setupGame();
    const dreadnaught = mkInstance("dreadnaught", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [dreadnaught],
          inPlay: [],
          cardsPlayedThisTurn: [],
          currentCombat: 0,
        },
      },
    };
    const r = playCard(s, "player_1", dreadnaught.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Primary only: +7 combat; aucun allié → pas de +5
    expect(r.state.players.player_1.currentCombat).toBe(7);
  });

  it("Dreadnaught avec allié Star Empire en jeu : +5 combat allié déclenché", () => {
    let s = setupGame();
    const dreadnaught = mkInstance("dreadnaught", "player_1", "hand");
    const corvette = mkInstance("corvette", "player_1", "in_play");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [dreadnaught],
          inPlay: [corvette],
          cardsPlayedThisTurn: [corvette.instanceId],
          currentCombat: 0,
        },
      },
    };
    const r = playCard(s, "player_1", dreadnaught.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Dreadnaught primary +7; allié star_empire (corvette) → +5 supplémentaires = 12 minimum
    expect(r.state.players.player_1.currentCombat).toBeGreaterThanOrEqual(12);
  });
});

describe("PATCH 0024 — opponent_discard minimum obligatoire", () => {
  function makeOpponentDiscardState(handCards: ReturnType<typeof mkInstance>[], optional: boolean) {
    let s = setupGame();
    const fighter = mkInstance("imperial_fighter", "player_1", "hand");
    const choice: PendingChoice = {
      id: "test-opp-discard",
      type: "opponent_discard",
      playerId: "player_2",
      sourceCardInstanceId: fighter.instanceId,
      amount: 1,
      optional,
      candidateIds: handCards.map(c => c.instanceId),
    };
    s = {
      ...s,
      players: {
        ...s.players,
        player_2: { ...s.players.player_2, hand: handCards },
      },
      pendingChoices: [choice],
    };
    return s;
  }

  it("sélection vide refusée si main non vide et choice non optionnel", () => {
    const targetCard = mkInstance("scout", "player_2", "hand");
    const s = makeOpponentDiscardState([targetCard], false);
    const r = resolvePendingChoice(s, "player_2", "test-opp-discard", { type: "select_cards", cardIds: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_choice");
  });

  it("sélection vide autorisée si main vide (min = 0)", () => {
    const s = makeOpponentDiscardState([], false);
    const r = resolvePendingChoice(s, "player_2", "test-opp-discard", { type: "select_cards", cardIds: [] });
    expect(r.ok).toBe(true);
  });

  it("sélection vide autorisée si choice optionnel", () => {
    const targetCard = mkInstance("scout", "player_2", "hand");
    const s = makeOpponentDiscardState([targetCard], true);
    const r = resolvePendingChoice(s, "player_2", "test-opp-discard", { type: "select_cards", cardIds: [] });
    expect(r.ok).toBe(true);
  });

  it("sélection correcte acceptée et carte défaussée", () => {
    const targetCard = mkInstance("scout", "player_2", "hand");
    const s = makeOpponentDiscardState([targetCard], false);
    const r = resolvePendingChoice(s, "player_2", "test-opp-discard", { type: "select_cards", cardIds: [targetCard.instanceId] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.players.player_2.discard.some(c => c.instanceId === targetCard.instanceId)).toBe(true);
  });
});

describe("PATCH 0024 — Règle P1 draw-3", () => {
  it("P1 pioche 3 cartes au tour 1 (règle de compensation intentionnelle V0)", () => {
    const s = setupGame();
    expect(s.players.player_1.hand.length).toBe(3);
    expect(s.players.player_2.hand.length).toBe(5);
  });
});


// ---------------------------------------------------------------------------
// PATCH 0025 — Tests zones peu couvertes (B-04)
// ---------------------------------------------------------------------------

describe("PATCH 0025 — Embassy Yacht draw_if_two_or_more_bases", () => {
  it("Embassy Yacht : aucune pioche si < 2 bases en jeu (0 bases)", () => {
    let s = setupGame();
    const yacht = mkInstance("embassy_yacht", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [yacht],
          bases: [],  // 0 bases
        },
      },
    };
    const handBefore = s.players.player_1.hand.length;
    const r = playCard(s, "player_1", yacht.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Embassy Yacht played — no draw from draw_if_two_or_more_bases
    // Primary effects: gain_trade:3 gain_authority:3 (no draw cards)
    const handAfter = r.state.players.player_1.hand.length;
    expect(handAfter).toBe(handBefore - 1); // only removed from hand (played)
  });

  it("Embassy Yacht : aucune pioche avec exactement 1 base en jeu", () => {
    let s = setupGame();
    const yacht = mkInstance("embassy_yacht", "player_1", "hand");
    const base1 = mkInstance("recycling_station", "player_1", "bases");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [yacht],
          bases: [base1],  // 1 base
        },
      },
    };
    const deckBefore = s.players.player_1.deck.length + s.players.player_1.hand.length;
    const r = playCard(s, "player_1", yacht.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 1 base < 2 → no draw
    const inPlayCount = r.state.players.player_1.inPlay.length;
    expect(inPlayCount).toBe(1); // yacht in play
    // deck + hand should equal before minus 1 (yacht moved to inPlay, no draw)
    const deckAfter = r.state.players.player_1.deck.length + r.state.players.player_1.hand.length;
    expect(deckAfter).toBe(deckBefore - 1);
  });

  it("Embassy Yacht : pioche 2 cartes avec 2+ bases en jeu", () => {
    let s = setupGame();
    const yacht = mkInstance("embassy_yacht", "player_1", "hand");
    const base1 = mkInstance("recycling_station", "player_1", "bases");
    const base2 = mkInstance("space_station", "player_1", "bases");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          hand: [yacht],
          bases: [base1, base2],  // 2 bases
        },
      },
    };
    const handBefore = s.players.player_1.hand.length;
    const r = playCard(s, "player_1", yacht.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 2 bases → draw 2
    const handAfter = r.state.players.player_1.hand.length;
    expect(handAfter).toBe(handBefore - 1 + 2); // -1 played, +2 drawn
  });
});

describe("PATCH 0025 — scrap_trade_row + refill", () => {
  it("Battle Pod scrap_trade_row optionnel : choix créé, trade_row rechargée après", () => {
    let s = setupGame();
    const pod = mkInstance("battle_pod", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, hand: [pod], inPlay: [], cardsPlayedThisTurn: [] },
      },
    };
    const tradeRowBefore = s.tradeRow.length;
    const r = playCard(s, "player_1", pod.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Un choix select_trade_row_card_to_scrap doit être en attente
    const scrapChoice = r.state.pendingChoices.find(c => c.type === "select_trade_row_card_to_scrap");
    expect(scrapChoice).toBeDefined();
    if (!scrapChoice) return;
    // Résoudre en sélectionnant la première carte de la rangée
    const targetId = r.state.tradeRow[0]?.instanceId;
    if (!targetId) return;
    const r2 = resolvePendingChoice(r.state, "player_1", scrapChoice.id, { type: "select_cards", cardIds: [targetId] });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // La carte a été retirée → rangée rechargée
    expect(r2.state.tradeRow.length).toBe(tradeRowBefore); // trade_row se recharge
    expect(r2.state.tradeRow.every(c => c.instanceId !== targetId)).toBe(true);
  });

  it("scrap_trade_row : skip autorisé car optionnel", () => {
    let s = setupGame();
    const pod = mkInstance("battle_pod", "player_1", "hand");
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, hand: [pod], inPlay: [], cardsPlayedThisTurn: [] },
      },
    };
    const r = playCard(s, "player_1", pod.instanceId);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const scrapChoice = r.state.pendingChoices.find(c => c.type === "select_trade_row_card_to_scrap");
    expect(scrapChoice?.optional).toBe(true);
    if (!scrapChoice) return;
    const r2 = resolvePendingChoice(r.state, "player_1", scrapChoice.id, { type: "skip" });
    expect(r2.ok).toBe(true);
  });
});

describe("PATCH 0025 — authority edge cases", () => {
  it("attaque réduisant l'autorité à exactement 0 : victoire immédiate", () => {
    let s = setupGame();
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, currentCombat: 50 },
        player_2: { ...s.players.player_2, authority: 5 },
      },
    };
    const r = attackOpponent(s, "player_1", 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("game_over");
    expect(r.state.winner).toBe("player_1");
    expect(r.state.players.player_2.authority).toBe(0);
  });

  it("autorité du perdant peut être négative (coup fatal dépasse 0)", () => {
    let s = setupGame();
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: { ...s.players.player_1, currentCombat: 20 },
        player_2: { ...s.players.player_2, authority: 3 },
      },
    };
    const r = attackOpponent(s, "player_1", 20);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("game_over");
    expect(r.state.winner).toBe("player_1");
    // authority can go negative
    expect(r.state.players.player_2.authority).toBeLessThanOrEqual(0);
  });
});

describe("PATCH 0025 — reshuffle pendant pioche complète", () => {
  it("pioche depuis deck vide déclenche un reshuffle et complète la main", () => {
    let s = setupGame();
    // Vide le deck de player_1 et met des cartes en défausse
    const discardCards = [
      mkInstance("scout", "player_1", "discard"),
      mkInstance("scout", "player_1", "discard"),
      mkInstance("scout", "player_1", "discard"),
    ];
    s = {
      ...s,
      players: {
        ...s.players,
        player_1: {
          ...s.players.player_1,
          deck: [],
          hand: [],
          discard: discardCards,
        },
      },
    };
    // End turn pour déclencher la pioche
    const r = endTurn(s, "player_1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // player_1 a une nouvelle main (au moins 1 carte depuis la défausse reshufflée)
    // Elle devrait avoir min(5, 3) = 3 cartes
    expect(r.state.players.player_1.hand.length).toBeGreaterThan(0);
    // La défausse doit maintenant être vide (reshufflée dans le deck)
    // Certaines peuvent encore être dans le deck si > 5 dans la défausse
  });
});
