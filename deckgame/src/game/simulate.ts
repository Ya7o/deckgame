import type { GameState, PlayerId } from "./types";
import type { BotProfileId } from "./bot-profile";
import { BOT_PROFILES } from "./bot-profile";
import { setupGame } from "./engine";
import { runBotTurn } from "./bot";
import { validateStateInvariants } from "./validators";
import type { SetupOptions } from "./types";

// ---------------------------------------------------------------------------
// Simulation types
// ---------------------------------------------------------------------------

export type SimulationResult = {
  seed: number;
  winner: PlayerId | "none";
  turns: number;
  terminatedBy: "authority" | "maxTurns" | "engineError" | "invariantViolation";
  engineError?: string;
  invariantErrors?: string[];
  actions: number;
  finalAuthority: Record<PlayerId, number>;
  profileP1: BotProfileId;
  profileP2: BotProfileId;
};

export type SimulationOptions = {
  seed: number;
  maxTurns?: number;
  profileP1?: BotProfileId;
  profileP2?: BotProfileId;
};

// ---------------------------------------------------------------------------
// mulberry32 — deterministic seeded RNG (same as in tests)
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// runSimulation — one full game Bot vs Bot
// ---------------------------------------------------------------------------

export function runSimulation(opts: SimulationOptions): SimulationResult {
  const { seed, maxTurns = 200 } = opts;
  const pP1: BotProfileId = opts.profileP1 ?? "balanced";
  const pP2: BotProfileId = opts.profileP2 ?? "balanced";
  const rand = mulberry32(seed);

  const setupOpts: SetupOptions = {
    player1Name: `Bot1(${pP1})`,
    player2Name: `Bot2(${pP2})`,
    rand,
  };

  let state: GameState = setupGame(setupOpts);
  let totalActions = 0;
  let turn = 0;

  while (state.phase !== "game_over" && turn < maxTurns) {
    turn++;
    const currentPlayer = state.currentPlayerId;
    const profile = BOT_PROFILES[currentPlayer === "player_1" ? pP1 : pP2];
    const result = runBotTurn(state, currentPlayer, { profile });
    totalActions += result.actions.length;

    if (!result.ok) {
      return {
        seed,
        winner: "none",
        turns: turn,
        terminatedBy: "engineError",
        engineError: result.error,
        actions: totalActions,
        finalAuthority: {
          player_1: result.state.players.player_1.authority,
          player_2: result.state.players.player_2.authority,
        },
        profileP1: pP1,
        profileP2: pP2,
      };
    }

    state = result.state;

    // Validate invariants every turn
    const errs = validateStateInvariants(state);
    if (errs.length > 0) {
      return {
        seed,
        winner: state.winner ?? "none",
        turns: turn,
        terminatedBy: "invariantViolation",
        invariantErrors: errs,
        actions: totalActions,
        finalAuthority: {
          player_1: state.players.player_1.authority,
          player_2: state.players.player_2.authority,
        },
        profileP1: pP1,
        profileP2: pP2,
      };
    }
  }

  if (state.phase === "game_over") {
    return {
      seed,
      winner: state.winner ?? "none",
      turns: turn,
      terminatedBy: "authority",
      actions: totalActions,
      finalAuthority: {
        player_1: state.players.player_1.authority,
        player_2: state.players.player_2.authority,
      },
      profileP1: pP1,
      profileP2: pP2,
    };
  }

  // maxTurns reached
  return {
    seed,
    winner: "none",
    turns: turn,
    terminatedBy: "maxTurns",
    actions: totalActions,
    finalAuthority: {
      player_1: state.players.player_1.authority,
      player_2: state.players.player_2.authority,
    },
    profileP1: pP1,
    profileP2: pP2,
  };
}

// ---------------------------------------------------------------------------
// runBatch — run N simulations from sequential seeds
// ---------------------------------------------------------------------------

export type BatchSummary = {
  total: number;
  completed: number;
  maxTurnsHit: number;
  engineErrors: number;
  invariantViolations: number;
  wins: Record<PlayerId | "none", number>;
  winRateP1: number;
  winRateP2: number;
  avgTurns: number;
  medianTurns: number;
  minTurns: number;
  maxTurns: number;
  avgActions: number;
  suspectSeeds: number[];
  results: SimulationResult[];
};

export function runBatch(count: number, startSeed = 1, maxTurnsPerGame = 200, profileP1: BotProfileId = "balanced", profileP2: BotProfileId = "balanced"): BatchSummary {
  const results: SimulationResult[] = [];

  for (let i = 0; i < count; i++) {
    results.push(runSimulation({ seed: startSeed + i, maxTurns: maxTurnsPerGame, profileP1, profileP2 }));
  }

  const completed = results.filter(r => r.terminatedBy === "authority").length;
  const maxTurnsHit = results.filter(r => r.terminatedBy === "maxTurns").length;
  const engineErrors = results.filter(r => r.terminatedBy === "engineError").length;
  const invariantViolations = results.filter(r => r.terminatedBy === "invariantViolation").length;

  const wins: Record<PlayerId | "none", number> = { player_1: 0, player_2: 0, none: 0 };
  for (const r of results) wins[r.winner] = (wins[r.winner] ?? 0) + 1;

  const allTurns = results.map(r => r.turns).sort((a, b) => a - b);
  const mid = Math.floor(allTurns.length / 2);

  const suspectSeeds = results
    .filter(r => r.terminatedBy !== "authority")
    .map(r => r.seed);

  return {
    total: count,
    completed,
    maxTurnsHit,
    engineErrors,
    invariantViolations,
    wins,
    winRateP1: count > 0 ? wins.player_1 / count : 0,
    winRateP2: count > 0 ? wins.player_2 / count : 0,
    avgTurns: allTurns.length > 0 ? allTurns.reduce((a, b) => a + b, 0) / allTurns.length : 0,
    medianTurns: allTurns.length > 0 ? (allTurns.length % 2 === 0 ? (allTurns[mid - 1] + allTurns[mid]) / 2 : allTurns[mid]) : 0,
    minTurns: allTurns.length > 0 ? allTurns[0] : 0,
    maxTurns: allTurns.length > 0 ? allTurns[allTurns.length - 1] : 0,
    avgActions: results.length > 0 ? results.reduce((a, r) => a + r.actions, 0) / results.length : 0,
    suspectSeeds,
    results,
  };
}
