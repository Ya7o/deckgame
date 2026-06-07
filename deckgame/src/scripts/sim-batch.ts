#!/usr/bin/env node
/**
 * sim-batch.ts — Batch simulation runner (PATCH 0019)
 * Usage: npm run sim:batch [count] [startSeed]
 * Default: 100 simulations starting at seed 1
 */
import { runBatch } from "../game/simulate";

const count = parseInt(process.argv[2] ?? "100", 10);
const startSeed = parseInt(process.argv[3] ?? "1", 10);

console.log(`\n=== SIM:BATCH — ${count} parties (seeds ${startSeed}–${startSeed + count - 1}) ===\n`);

const t0 = Date.now();
const summary = runBatch(count, startSeed);
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

console.log(`Terminées par victoire     : ${summary.completed}/${count} (${(summary.winRateP1 + summary.winRateP2) * 100 | 0}%)`);
console.log(`MaxTurns atteint           : ${summary.maxTurnsHit}`);
console.log(`Erreurs moteur             : ${summary.engineErrors}`);
console.log(`Violations d'invariant     : ${summary.invariantViolations}`);
console.log();
console.log(`Victoires player_1         : ${summary.wins.player_1} (${(summary.winRateP1 * 100).toFixed(1)}%)`);
console.log(`Victoires player_2         : ${summary.wins.player_2} (${(summary.winRateP2 * 100).toFixed(1)}%)`);
console.log(`Aucun gagnant              : ${summary.wins.none}`);
console.log();
console.log(`Tours moy / méd / min / max: ${summary.avgTurns.toFixed(1)} / ${summary.medianTurns} / ${summary.minTurns} / ${summary.maxTurns}`);
console.log(`Actions moyennes/partie    : ${summary.avgActions.toFixed(1)}`);
console.log();
if (summary.suspectSeeds.length > 0) {
  console.log(`Seeds suspectes (${summary.suspectSeeds.length}): ${summary.suspectSeeds.slice(0, 10).join(", ")}${summary.suspectSeeds.length > 10 ? "..." : ""}`);
} else {
  console.log("Seeds suspectes : aucune");
}
console.log(`\nDurée : ${elapsed}s`);

// Alertes
const alerts: string[] = [];
if (summary.maxTurnsHit / count > 0.05) alerts.push(`ALERTE: ${summary.maxTurnsHit} parties arrêtées par maxTurns (>${5}%)`);
if (summary.winRateP1 > 0.65) alerts.push(`ALERTE: winRate P1 = ${(summary.winRateP1 * 100).toFixed(1)}% (seuil 65%)`);
if (summary.winRateP2 > 0.65) alerts.push(`ALERTE: winRate P2 = ${(summary.winRateP2 * 100).toFixed(1)}% (seuil 65%)`);
if (summary.avgTurns > 80) alerts.push(`ALERTE: durée moyenne = ${summary.avgTurns.toFixed(1)} tours (seuil 80)`);
if (summary.engineErrors > 0) alerts.push(`ALERTE: ${summary.engineErrors} erreurs moteur`);
if (summary.invariantViolations > 0) alerts.push(`ALERTE: ${summary.invariantViolations} violations d'invariant`);

if (alerts.length > 0) {
  console.log("\n" + alerts.join("\n"));
} else {
  console.log("\nAucune alerte.");
}
console.log();
