# PATCH 0004 — Valider strictement les pending choices

## Objectif
Rendre `resolveChoice` strict : toute validation échoue avant toute mutation de `GameState`, et l'état original est renvoyé inchangé en cas d'erreur.

## Corrections apportées

### `src/game/choices.ts`
- Changement de signature : `resolveChoice` retourne maintenant `EngineResult` au lieu de `GameState`.
- Toutes les validations per-type sont effectuées **avant** que le choix soit retiré de `pendingChoices`.
- En cas d'erreur, `err(originalState, error)` est retourné — l'état n'est jamais muté.
- Le helper `resolveCandidates` non utilisé a été supprimé (lint).

Validations ajoutées :
| Type | Vérifications |
|---|---|
| `choose_one` | `optionIndex` dans `[0, options.length)` |
| `select_cards_to_scrap` | `cardIds.length ≤ amount`, tous dans `candidateIds`, tous dans `hand` ou `discard` du joueur |
| `select_trade_row_card_to_scrap` | max 1, doit être dans `tradeRow` |
| `select_base_to_destroy` | max 1, doit être dans les bases adverses |
| `select_cards_to_discard_then_draw` | `cardIds.length ≤ max`, tous dans `hand` |
| `opponent_discard` | tous dans `hand`, count `≤ amount` |
| `select_ship_to_copy` | dans `inPlay`, pas soi-même, type `ship` |
| `select_ship_to_acquire_free` | dans `tradeRow`, type `ship` |
| `skip` | seulement si `choice.optional === true` |

### `src/game/engine.ts` — `resolvePendingChoice`
- Les vérifications dupliquées (`choice not found`, `playerId !== playerId`) supprimées.
- Délègue directement : `return resolveChoice(state, playerId, choiceId, payload)`.
- Seule la garde `game_already_over` reste propre à cette couche.

## Preuves — tests ajoutés (8 nouveaux)
| Test | Résultat |
|---|---|
| choiceId inconnu → `invalid_choice`, état référence inchangé | ✅ |
| mauvais joueur → `not_your_turn`, état inchangé | ✅ |
| `choose_one` index hors bornes → `invalid_choice`, choix non consommé | ✅ |
| `select_cards_to_scrap` trop de cartes → `invalid_choice` | ✅ |
| `select_cards_to_scrap` carte hors candidateIds → `invalid_target` | ✅ |
| `select_cards_to_scrap` carte dans candidateIds mais absente hand/discard → `invalid_target` | ✅ |
| `skip` sur choix non-optionnel → `invalid_choice` | ✅ |
| `skip` sur choix optionnel → ok, choix retiré | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 55 tests ✅ / build ✅

## Hash du commit
À compléter après commit.
