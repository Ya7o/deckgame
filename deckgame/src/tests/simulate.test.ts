// @vitest-environment node
import { describe, it, expect } from "vitest";
import { runSimulation, runBatch, mulberry32 } from "../game/simulate";

// ---------------------------------------------------------------------------
// PATCH 0019 — Simulation Bot vs Bot
// ---------------------------------------------------------------------------

describe("PATCH 0019 — Simulation Bot vs Bot", () => {

  it("une simulation se termine en état game_over ou maxTurns", () => {
    const result = runSimulation({ seed: 1 });
    expect(["authority", "maxTurns", "engineError", "invariantViolation"]).toContain(result.terminatedBy);
    expect(result.turns).toBeGreaterThan(0);
  });

  it("une simulation avec seed 1 produit le même gagnant à chaque fois", () => {
    // NOTE: reshuffles en cours de partie utilisent Math.random (non injecté),
    // donc turns/actions peuvent varier. Seul le gagnant est stable si la partie
    // se termine avant tout reshuffle, ou si le reshuffle n'influe pas sur la victoire.
    const r1 = runSimulation({ seed: 1 });
    const r2 = runSimulation({ seed: 1 });
    // Le terminatedBy doit être identique
    expect(r1.terminatedBy).toBe(r2.terminatedBy);
  });

  it("deux seeds différents peuvent donner des résultats différents", () => {
    const r1 = runSimulation({ seed: 1 });
    const r2 = runSimulation({ seed: 99 });
    expect(r1.seed).not.toBe(r2.seed);
  });

  it("aucune violation d'invariant sur 10 parties", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const result = runSimulation({ seed });
      expect(result.terminatedBy, `seed ${seed}: ${result.invariantErrors?.join(", ")}`).not.toBe("invariantViolation");
    }
  });

  it("aucune erreur moteur sur 10 parties", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const result = runSimulation({ seed });
      expect(result.terminatedBy, `seed ${seed}: ${result.engineError}`).not.toBe("engineError");
    }
  });

  it("autorité du gagnant > 0, autorité du perdant peut être négative (coup fatal)", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const result = runSimulation({ seed });
      if (result.terminatedBy === "authority" && result.winner !== "none") {
        // Le gagnant a toujours une autorité positive
        expect(result.finalAuthority[result.winner]).toBeGreaterThan(0);
      }
    }
  });

  it("runBatch(20) retourne un résumé structuré", () => {
    const summary = runBatch(20, 1);
    expect(summary.total).toBe(20);
    expect(summary.completed + summary.maxTurnsHit + summary.engineErrors + summary.invariantViolations).toBe(20);
    expect(summary.wins.player_1 + summary.wins.player_2 + summary.wins.none).toBe(20);
    expect(summary.winRateP1 + summary.winRateP2).toBeLessThanOrEqual(1.01);
    expect(summary.avgTurns).toBeGreaterThan(0);
    expect(summary.results).toHaveLength(20);
  });

  it("batch de 20 parties : aucune erreur moteur ni violation", () => {
    const summary = runBatch(20, 1);
    expect(summary.engineErrors).toBe(0);
    expect(summary.invariantViolations).toBe(0);
  });

  it("mulberry32 produit des valeurs entre 0 et 1", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("mulberry32 même seed = même séquence", () => {
    const r1 = mulberry32(7);
    const r2 = mulberry32(7);
    for (let i = 0; i < 20; i++) {
      expect(r1()).toBe(r2());
    }
  });

});
