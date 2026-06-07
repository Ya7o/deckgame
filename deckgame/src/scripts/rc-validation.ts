/// <reference types="node" />
import { runBatch } from "../game/simulate";
import type { BotProfileId } from "../game/bot-profile";

console.log("=== PATCH 0028 RC Validation ===\n");

// 1. Main batch: 200 games balanced vs balanced, seeds 3000-3199
const main = runBatch(200, 3000);
console.log("--- Batch 200 parties (seeds 3000-3199) ---");
console.log(`Total: ${main.total}`);
console.log(`Engine errors: ${main.engineErrors}`);
console.log(`Invariant violations: ${main.invariantViolations}`);
console.log(`MaxTurns hit: ${main.maxTurnsHit} (${(main.maxTurnsHit / main.total * 100).toFixed(1)}%)`);
console.log(`WinRate P1: ${(main.winRateP1 * 100).toFixed(1)}%`);
console.log(`WinRate P2: ${(main.winRateP2 * 100).toFixed(1)}%`);
console.log(`AvgTurns: ${main.avgTurns.toFixed(1)}`);
console.log(`MedianTurns: ${main.medianTurns}`);
if (main.suspectSeeds.length > 0) console.log(`Suspect seeds: ${main.suspectSeeds.join(", ")}`);

// 2. Profile cross-check
const profiles: BotProfileId[] = ["balanced", "aggressive", "economy", "defensive"];
console.log("\n--- Profils bot (50 parties chacun, seeds 4000-4049) ---");
for (const p of profiles) {
  const r = runBatch(50, 4000, 200, p, "balanced");
  console.log(`  ${p} vs balanced : P1=${(r.winRateP1 * 100).toFixed(0)}%  errors=${r.engineErrors}  violations=${r.invariantViolations}`);
}

// Summary
console.log("\n=== RESUME RC ===");
const ok1 = main.engineErrors === 0;
const ok2 = main.invariantViolations === 0;
const ok3 = main.maxTurnsHit / main.total <= 0.05;
const ok4 = main.winRateP1 < 0.70 && main.winRateP2 < 0.70;
const ok5 = main.avgTurns < 80;
console.log(`0 erreurs moteur      : ${ok1 ? "PASS" : "FAIL (" + main.engineErrors + ")"}`);
console.log(`0 violations invariant : ${ok2 ? "PASS" : "FAIL (" + main.invariantViolations + ")"}`);
console.log(`maxTurns < 5%          : ${ok3 ? "PASS" : "FAIL (" + (main.maxTurnsHit / main.total * 100).toFixed(1) + "%)"}`);
console.log(`winRate < 70%          : ${ok4 ? "PASS" : "FAIL"}`);
console.log(`avgTurns < 80          : ${ok5 ? "PASS" : "FAIL (" + main.avgTurns.toFixed(1) + ")"}`);
const allPass = ok1 && ok2 && ok3 && ok4 && ok5;
console.log(`\nRC STATUS: ${allPass ? "GREEN" : "RED"}`);
