# PATCH 0001 — Stabiliser les commandes QA et le lint

## Objectif
Créer une commande `npm run check` fiable et corriger les 8 erreurs ESLint sans modifier la logique métier.

## Résultat
✅ `npm run check` passe : lint clean + 35 tests + build réussi.

## Fichiers modifiés
| Fichier | Changement |
|---|---|
| `package.json` | Ajout du script `"check": "npm run lint && npm test && npm run build"` |
| `src/game/effects.ts` | Suppression du paramètre `_state` inutilisé dans `getEffectiveFactions`, mise à jour des appels |
| `src/game/engine.ts` | `let discard` → `const discard` (prefer-const) |
| `src/game/utils.ts` | `let s` → `const s` dans `moveCard` (prefer-const) |
| `src/tests/engine.test.ts` | Import de `ChoicePayload`, remplacement de `any` par le type correct |
| `src/ui/CardDetailModal.tsx` | Import de `Effect`, `describeEffect(e: any)` → `describeEffect(e: Effect)` |
| `src/ui/PendingChoicePanel.tsx` | Import de `Effect`, `(e: any)` → `(e: Effect)` dans deux fonctions |

## Tests exécutés
- `npm run lint` : 0 erreurs, 0 warnings
- `npm test` : 35 / 35 passent
- `npm run build` : build en 251ms, 0 erreur TypeScript

## Limites restantes
- Les bugs moteur signalés dans les patchs suivants (double activation Bases, validation Combat, etc.) ne sont pas encore corrigés.

## Hash du commit
À compléter après commit.
