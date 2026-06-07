# PATCH 0019 — Mode Simulation Bot vs Bot

## Objectif

Ajouter un runner de simulation Bot vs Bot réutilisable et déterministe,
qui servira de base aux analyses d'équilibrage de PATCH 0020.

---

## 1. Fichiers ajoutés

| Fichier | Description |
|---|---|
| `deckgame/src/game/simulate.ts` | Runner `runSimulation` + `runBatch` + `mulberry32` |
| `deckgame/src/scripts/sim-batch.ts` | Script CLI : `npm run sim:batch [count] [startSeed]` |
| `deckgame/src/tests/simulate.test.ts` | 10 tests unitaires du runner |
| `reports/patch-0019/review.md` | Ce rapport |

**Scripts npm ajoutés :**
```json
"sim:batch": "npx tsx src/scripts/sim-batch.ts"
```

---

## 2. API du runner

### `runSimulation(opts)`
```typescript
type SimulationOptions = { seed: number; maxTurns?: number };
type SimulationResult = {
  seed, winner, turns, terminatedBy,
  engineError?, invariantErrors?,
  actions, finalAuthority
};
```
Lance une partie complète Bot vs Bot avec seed déterministe.

### `runBatch(count, startSeed, maxTurnsPerGame)`
```typescript
type BatchSummary = {
  total, completed, maxTurnsHit, engineErrors, invariantViolations,
  wins, winRateP1, winRateP2,
  avgTurns, medianTurns, minTurns, maxTurns, avgActions,
  suspectSeeds, results
};
```
Lance `count` simulations séquentielles depuis `startSeed`.

---

## 3. Résultats npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 137 passed (69 moteur + 25 bot + 14 i18n + 19 gameboard jsdom + 10 simulate)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## 4. Résultats npm run sim:batch (100 parties, seeds 1–100)

```
=== SIM:BATCH — 100 parties (seeds 1–100) ===

Terminées par victoire     : 100/100 (100%)
MaxTurns atteint           : 0
Erreurs moteur             : 0
Violations d'invariant     : 0

Victoires player_1         : 56 (56.0%)
Victoires player_2         : 44 (44.0%)
Aucun gagnant              : 0

Tours moy / méd / min / max: 31.7 / 30 / 19 / 65
Actions moyennes/partie    : 331.6

Seeds suspectes : aucune
Durée : 0.35s
Aucune alerte.
```

---

## 5. Limites connues

- **Reshuffles non déterministes** : `draw.ts` utilise `Math.random` (non injecté) pour les reshuffles de pioche en cours de partie. L'état initial est déterministe (shuffle via `rand`), mais les reshuffles peuvent varier d'une exécution à l'autre avec le même seed. Documenté en PATCH 0018 comme dette P3. Les statistiques de batch restent valables en termes de distribution.

- **Un seul profil bot** : PATCH 0021 ajoutera des profils configurables pour comparer les stratégies.

---

## 6. File d'attente

| Patch | Titre |
|---|---|
| **PATCH 0020** | Exploiter les simulations Bot vs Bot pour établir un premier rapport d'équilibrage |

---

## Hash du commit

3f0f771
