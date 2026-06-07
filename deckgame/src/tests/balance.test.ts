// @vitest-environment node
import { describe, it, expect } from "vitest";
import { runBatch } from "../game/simulate";

// ---------------------------------------------------------------------------
// PATCH 0020 — Rapport d'équilibrage baseline
// ---------------------------------------------------------------------------

describe("PATCH 0020 — Seuils de stabilité baseline", () => {

  it("50 parties : aucune erreur moteur ni violation d'invariant", () => {
    const summary = runBatch(50, 1000); // seeds 1000-1049 (évite overlap avec patch-0019)
    expect(summary.engineErrors).toBe(0);
    expect(summary.invariantViolations).toBe(0);
  });

  it("50 parties : maxTurns jamais atteint (seuil 5%)", () => {
    const summary = runBatch(50, 1000);
    expect(summary.maxTurnsHit / summary.total).toBeLessThanOrEqual(0.05);
  });

  it("50 parties : winrate P1 < 70% (seuil déséquilibre fort)", () => {
    const summary = runBatch(50, 1000);
    expect(summary.winRateP1).toBeLessThan(0.70);
  });

  it("50 parties : winrate P2 < 70% (seuil déséquilibre fort)", () => {
    const summary = runBatch(50, 1000);
    expect(summary.winRateP2).toBeLessThan(0.70);
  });

  it("50 parties : durée moyenne < 80 tours", () => {
    const summary = runBatch(50, 1000);
    expect(summary.avgTurns).toBeLessThan(80);
  });

  it("résumé batch contient toutes les métriques attendues", () => {
    const summary = runBatch(10, 500);
    expect(typeof summary.winRateP1).toBe("number");
    expect(typeof summary.winRateP2).toBe("number");
    expect(typeof summary.avgTurns).toBe("number");
    expect(typeof summary.medianTurns).toBe("number");
    expect(Array.isArray(summary.suspectSeeds)).toBe(true);
    expect(Array.isArray(summary.results)).toBe(true);
  });

});
