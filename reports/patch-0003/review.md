# PATCH 0003 — Sécuriser attackOpponent et les montants de Combat

## Objectif
Rendre `attackOpponent` strict : rejeter les montants invalides (≤ 0, non-entier, > combat disponible) et garantir qu'une action illégale ne modifie jamais le `GameState`.

## Corrections apportées

### `src/game/types.ts`
Ajout de `"invalid_amount"` dans le type `EngineError`.

### `src/game/engine.ts` — `attackOpponent`
Validations ajoutées en tête de fonction, avant toute mutation :
1. `!Number.isInteger(amount) || amount <= 0` → `"invalid_amount"`
2. `amount > player.currentCombat` → `"insufficient_combat"` (condition corrigée : `<` → `>` pour cohérence)
3. Outpost présent → `"outpost_blocking"` (déjà présent, conservé)

Toutes les vérifications renvoient `{ ok: false, state }` avec l'état **original non muté**.

## Preuves — tests ajoutés (7 nouveaux)
| Test | Résultat |
|---|---|
| amount = 0 → `invalid_amount`, state inchangé | ✅ |
| amount = -3 → `invalid_amount`, state inchangé | ✅ |
| amount = 2.5 → `invalid_amount`, state inchangé | ✅ |
| amount > currentCombat → `insufficient_combat`, state inchangé | ✅ |
| outpost présent → `outpost_blocking`, authority et combat inchangés | ✅ |
| attaque valide réduit authority et combat | ✅ |
| attaque létale → `game_over`, winner = player_1 | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 47 tests ✅ / build ✅

## Limites restantes
- `attackBase` : pas de validation du type du montant (la défense vient de la définition de carte, toujours entier positif).

## Hash du commit
`543ce91`
