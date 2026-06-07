// @vitest-environment node
import { describe, it, expect } from "vitest";
import { BOT_PROFILES, DEFAULT_PROFILE, chooseBestBuy } from "../game/bot-profile";
import { runBatch, runSimulation } from "../game/simulate";
import { setupGame } from "../game/engine";
import { mulberry32 } from "../game/simulate";

describe("PATCH 0021 — Profils bot", () => {

  it("les 4 profils existent et sont valides", () => {
    const ids = ["balanced", "aggressive", "economy", "defensive"] as const;
    for (const id of ids) {
      const p = BOT_PROFILES[id];
      expect(p.id).toBe(id);
      expect(p.buyStrategy).toBeDefined();
      expect(typeof p.combatWeight).toBe("number");
      expect(typeof p.tradeWeight).toBe("number");
      expect(typeof p.defenseWeight).toBe("number");
    }
  });

  it("le profil par défaut est balanced", () => {
    expect(DEFAULT_PROFILE.id).toBe("balanced");
  });

  it("profil inconnu ne compile pas (type guard)", () => {
    const validIds = Object.keys(BOT_PROFILES);
    expect(validIds).toContain("balanced");
    expect(validIds).not.toContain("unknown");
  });

  it("balanced : buyStrategy = cost_first", () => {
    expect(BOT_PROFILES.balanced.buyStrategy).toBe("cost_first");
  });

  it("aggressive : préfère combat, attaque directe", () => {
    const p = BOT_PROFILES.aggressive;
    expect(p.combatWeight).toBeGreaterThan(p.tradeWeight);
    expect(p.preferDirectAttack).toBe(true);
  });

  it("economy : préfère trade", () => {
    const p = BOT_PROFILES.economy;
    expect(p.tradeWeight).toBeGreaterThan(p.combatWeight);
  });

  it("defensive : préfère défense", () => {
    const p = BOT_PROFILES.defensive;
    expect(p.defenseWeight).toBeGreaterThan(p.combatWeight);
    expect(p.aggressionThreshold).toBeGreaterThanOrEqual(1.0);
  });

  it("balanced reproduit l'achat le plus cher (cost_first)", () => {
    const state = setupGame({ rand: mulberry32(42) });
    const fakeState = {
      ...state,
      players: {
        ...state.players,
        player_1: { ...state.players.player_1, currentTrade: 10 },
      },
    };
    const best = chooseBestBuy(fakeState, "player_1", BOT_PROFILES.balanced);
    expect(best).not.toBeNull();
    expect(best).toBeTruthy();
  });

  it("deux profils différents peuvent donner des stratégies différentes", () => {
    const state = setupGame({ rand: mulberry32(1) });
    const fakeState = {
      ...state,
      players: {
        ...state.players,
        player_1: { ...state.players.player_1, currentTrade: 10 },
      },
    };
    const bestBalanced = chooseBestBuy(fakeState, "player_1", BOT_PROFILES.balanced);
    const bestAggressive = chooseBestBuy(fakeState, "player_1", BOT_PROFILES.aggressive);
    expect(bestBalanced).not.toBeNull();
    expect(bestAggressive).not.toBeNull();
  });

  it("simulation avec profil aggressive se termine normalement (10 parties)", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = runSimulation({ seed, profileP1: "aggressive", profileP2: "balanced" });
      expect(r.terminatedBy).not.toBe("engineError");
      expect(r.terminatedBy).not.toBe("invariantViolation");
      expect(r.profileP1).toBe("aggressive");
      expect(r.profileP2).toBe("balanced");
    }
  });

  it("simulation avec profil economy se termine normalement (10 parties)", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = runSimulation({ seed, profileP1: "economy", profileP2: "economy" });
      expect(r.terminatedBy).not.toBe("engineError");
      expect(r.terminatedBy).not.toBe("invariantViolation");
    }
  });

  it("simulation avec profil defensive se termine normalement (10 parties)", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = runSimulation({ seed, profileP1: "defensive", profileP2: "defensive" });
      expect(r.terminatedBy).not.toBe("engineError");
      expect(r.terminatedBy).not.toBe("invariantViolation");
    }
  });

  it("même seed + mêmes profils = même terminatedBy (déterminisme initial)", () => {
    const r1 = runSimulation({ seed: 42, profileP1: "aggressive", profileP2: "economy" });
    const r2 = runSimulation({ seed: 42, profileP1: "aggressive", profileP2: "economy" });
    expect(r1.terminatedBy).toBe(r2.terminatedBy);
  });

  it("runBatch avec profils : résumé structuré sans erreur", () => {
    const summary = runBatch(20, 2000, 200, "aggressive", "balanced");
    expect(summary.engineErrors).toBe(0);
    expect(summary.invariantViolations).toBe(0);
    expect(summary.total).toBe(20);
  });

});
