# PATCH 0027 — Cleanup V0

## Objectif

Résoudre les items de dette P3 B-07 à B-15 identifiés en PATCH 0023.
Aucune nouvelle mécanique, aucun changement d'équilibrage.

---

## 1. Items traités

### B-07 — GamePhase : valeurs mortes retirées

**Fichier** : `src/game/types.ts`

Retiré de `GamePhase` : `"setup"`, `"start_turn"`, `"resolving_choice"`, `"end_turn"`.
Aucun code n'assignait ces valeurs à `state.phase`. Seulement `"action_phase"` et
`"game_over"` sont utilisées.

**Avant** : 6 valeurs dans le type union
**Après** : 2 valeurs (`"action_phase"` | `"game_over"`)

---

### B-08 — PlayerState.pendingDiscard retiré

**Fichier** : `src/game/types.ts`, `src/game/engine.ts`

`pendingDiscard: number` était initialisé à 0 dans `setupGame` et `endTurn`
mais jamais lu pour une décision de jeu. Retiré du type et des deux sites
d'assignation.

---

### B-09 — PlayerState.hasEndedTurn retiré

**Fichier** : `src/game/types.ts`, `src/game/engine.ts`

`hasEndedTurn: boolean` était écrit (`true` en fin de tour, `false` au début)
mais jamais lu dans un conditionnel. Retiré du type et des 3 sites
d'assignation (setupGame, endTurn reset, endTurn next player).

---

### B-10 — GameState.playerOrder retiré

**Fichier** : `src/game/types.ts`, `src/game/engine.ts`

`playerOrder: PlayerId[]` initialisé `["player_1", "player_2"]` dans `setupGame`
mais jamais itéré. L'ordre des tours est déjà géré par `currentPlayerId` et
`opponentPlayerId`. Retiré du type et de l'initialisation.

---

### B-11 — activateSelfScrap : code erreur incorrect corrigé

**Fichier** : `src/game/engine.ts`, ligne 470 (avant patch)

La fonction `activateSelfScrap` cherche la carte dans `player.inPlay` ou
`player.bases`. Si non trouvée, retournait `"card_not_in_hand"` — erreur
incohérente (la carte n'est pas dans la main).

**Avant** : `return err(state, "card_not_in_hand")`
**Après** : `return err(state, "invalid_target")`

---

### B-12 — Reshuffles déterministes

**Fichiers** : `src/game/types.ts`, `src/game/engine.ts`, `src/game/draw.ts`

Ajout de `rand?: () => number` à `GameState`. Stocké depuis `SetupOptions.rand`
lors de `setupGame`. Passé à `shuffle(player.discard, s.rand)` dans `draw.ts`
lors des reshuffles.

Quand un seed est fourni (e.g. en simulation ou test), les reshuffles sont
maintenant déterministes sur toute la durée de la partie.

---

### B-13 — Explorer pile 10 → 16

**Fichier** : `src/game/engine.ts`

La pile est initialisée à 16 instances (était 10). La limite pratique pour
une partie V0 2 joueurs est ≤ 12-14 explorateurs achetés. 16 couvre tous
les cas raisonnables.

Note : dans les vraies règles Star Realms la pile est illimitée. B-13 est
marqué comme partiellement résolu — une implémentation on-demand (B-16) est
possible pour V1 si nécessaire.

**Impact sur les tests** : 2 assertions mises à jour
(`toBe(10)` → `toBe(16)`, `toBe(9)` → `toBe(15)`).

---

### B-14 — Audit rapports 0001–0022

Audit manuel effectué. Tous les rapports de PATCH 0001 à 0022 sont présents
dans `reports/`. Les formats sont cohérents. Aucune correction requise.

---

### B-15 — README créé

**Fichier** : `README.md` (racine du repo)

Créé avec : stack technique, instructions de démarrage, architecture des
fichiers, règles V0 supportées, historique des patchs.

---

## 2. Résultats

```
Tests : 190 (inchangé vs PATCH 0026 — 2 assertions mises à jour)
Lint : 0 erreur
Build : OK
TypeScript : 0 erreur
```

---

## 3. Items non traités

- B-16 (proposé) : Explorer pile on-demand — reporté en V1
- `wrong_phase` dans `EngineError` : conservé (valide conceptuellement)

---

## Hash du commit

- ea9a9c0
