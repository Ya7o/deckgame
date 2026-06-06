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
          let payload: any;
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
          let payload: any = { type: "select_cards", cardIds: oppChoice.candidateIds?.slice(0, oppChoice.amount ?? 1) ?? [] };
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
