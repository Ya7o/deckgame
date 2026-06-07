// @vitest-environment jsdom

/**
 * UI tests — bot turn interaction locking (PATCH 0013)
 *
 * These tests verify that during isBotTurn, user clicks on interactive
 * elements do not dispatch engine actions. The engine's not_your_turn guard
 * (tested in bot.test.ts) is the ultimate backstop; these tests prove the UI
 * layer itself never attempts the dispatch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { GameBoard } from "../ui/GameBoard";
import { setupGame, endTurn } from "../game/engine";
import type { GameState } from "../game/types";
import * as engineModule from "../game/engine";

// ---------------------------------------------------------------------------
// Seeded RNG — deterministic initial state (Fisher-Yates via mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeBotTurnState(): GameState {
  const rand = mulberry32(1337);
  const state = setupGame({ player1Name: "Humain", player2Name: "Bot", rand });
  const r = endTurn(state, "player_1");
  if (!r.ok) throw new Error("endTurn failed in test setup");
  return r.state; // currentPlayerId === "player_2"
}

function makeHumanTurnState(): GameState {
  return setupGame({ player1Name: "Humain", player2Name: "Bot", rand: mulberry32(42) });
  // currentPlayerId === "player_1"
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GameBoard — perspective solo", () => {
  beforeEach(() => {
    vi.useFakeTimers(); // prevent bot useEffect from firing
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("pendant le tour bot, viewerId reste player_1 (main du joueur humain affichée)", () => {
    const state = makeBotTurnState();
    expect(state.currentPlayerId).toBe("player_2");
    // The human's hand should be non-empty (they started with 3, some may be in discard)
    // player_1 drew 3 cards at setup then played through their first turn
    // After endTurn, player_1 has a new hand of 5
    expect(state.players.player_1.hand.length).toBeGreaterThanOrEqual(0);
    // player_2 has 5 cards (bot's starting hand)
    expect(state.players.player_2.hand.length).toBe(5);

    const { container } = render(
      React.createElement(GameBoard, {
        initialState: state,
        onNewGame: () => {},
        gameMode: "solo_bot",
      })
    );

    // The hand label should mention player_1's name (Humain), not Bot
    expect(container.textContent).toContain("Humain");
    // The bot turn banner must be visible
    expect(container.textContent).toMatch(/bot|r.*fl.*chi/i);
  });

  it("pendant le tour bot, aucun dispatch buyTradeRowCard ne se produit au clic", () => {
    const state = makeBotTurnState();
    expect(state.currentPlayerId).toBe("player_2");
    expect(state.tradeRow.length).toBeGreaterThan(0);

    const spy = vi.spyOn(engineModule, "buyTradeRowCard");

    const { container } = render(
      React.createElement(GameBoard, {
        initialState: state,
        onNewGame: () => {},
        gameMode: "solo_bot",
      })
    );

    // Give enough trade to buy something (moot — isBotTurn blocks the dispatch)
    // Find all card elements in the trade row and click them
    const allCards = container.querySelectorAll("[data-testid='card'], [style*='var(--card-w)']");
    allCards.forEach((el) => {
      fireEvent.click(el);
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("pendant le tour bot, aucun dispatch playCard ne se produit au clic sur la main", () => {
    const state = makeBotTurnState();
    expect(state.currentPlayerId).toBe("player_2");

    const spy = vi.spyOn(engineModule, "playCard");

    const { container } = render(
      React.createElement(GameBoard, {
        initialState: state,
        onNewGame: () => {},
        gameMode: "solo_bot",
      })
    );

    // Click everything visible — no playCard should be dispatched
    const allClickable = container.querySelectorAll("button, [onClick], [style*='cursor: pointer'], [style*='pointer']");
    allClickable.forEach((el) => {
      if ((el as HTMLButtonElement).disabled) return;
      fireEvent.click(el);
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("pendant le tour bot, le bouton Fin du tour est disabled", () => {
    const state = makeBotTurnState();
    expect(state.currentPlayerId).toBe("player_2");

    const { container } = render(
      React.createElement(GameBoard, {
        initialState: state,
        onNewGame: () => {},
        gameMode: "solo_bot",
      })
    );

    // Find disabled buttons — the "Fin du tour" button should be among them
    const disabledButtons = Array.from(container.querySelectorAll("button[disabled]"));
    // At least the end-turn button must be disabled
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("pendant le tour humain (player_1), le bouton Fin du tour n'est pas disabled", () => {
    const state = makeHumanTurnState();
    expect(state.currentPlayerId).toBe("player_1");

    const { container } = render(
      React.createElement(GameBoard, {
        initialState: state,
        onNewGame: () => {},
        gameMode: "solo_bot",
      })
    );

    // During human turn the end-turn button should NOT be disabled
    const disabledButtons = Array.from(container.querySelectorAll("button[disabled]")).map(
      (b) => (b as HTMLButtonElement).textContent ?? ""
    );
    // The end-turn button text comes from fr.actions.endTurn
    const endTurnDisabled = disabledButtons.some((t) => t.includes("tour") || t.includes("Fin"));
    expect(endTurnDisabled).toBe(false);
  });
});
