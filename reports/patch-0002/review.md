# PATCH 0002 — Corriger l'activation double des Bases

## Objectif
Empêcher qu'une Base applique ses effets primaires dès qu'elle est jouée via `playCard`. Les effets d'une Base ne doivent être déclenchés que via `activateBase`, une fois par tour.

## Bug corrigé
Dans `playCard`, la branche commune appliquait `primaryEffects` pour tous les types de cartes. Une Base comme Blob Wheel donnait +1 Combat dès le jeu, puis +1 Combat supplémentaire à l'activation.

## Correction apportée
`src/game/engine.ts` — fonction `playCard` :
- Si `def.type === "ship"` : comportement inchangé, effets appliqués immédiatement.
- Si `def.type === "base"` : aucun effet ressource appliqué. Seul le trigger `trigger_on_play_ship_gain_combat` (Fleet HQ) est enregistré à l'entrée en jeu — conformément aux règles (les ships joués APRÈS Fleet HQ bénéficient du +1 Combat).
- `counts_as_ally_all_factions` reste passif (interrogé à l'exécution, pas d'effet à déclencher).

## Preuves — assertions dans les tests
- `playCard(Blob Wheel)` → `currentCombat === 0` ✅
- `activateBase(Blob Wheel)` → `currentCombat === 1` ✅
- `activateBase(Blob Wheel)` × 2 → `error: base_already_exhausted` ✅
- `playCard(The Hive)` → `currentCombat === 0`, puis `activateBase` → `currentCombat === 3` ✅
- Base en jeu après `endTurn`, exhaustion reset ✅

## Fichiers modifiés
| Fichier | Changement |
|---|---|
| `src/game/engine.ts` | Séparation ship / base dans `playCard` |
| `src/tests/engine.test.ts` | 5 nouveaux tests Bases / activation |

## Tests exécutés
- `npm run check` : lint ✅ / 40 tests ✅ / build ✅

## Limites restantes
- Ally effects des Bases qui dépendent des ressources joués ce tour (ex. Blob World + Blob joués) : comportement inchangé, non impacté par ce patch.

## Hash du commit
À compléter après commit.
