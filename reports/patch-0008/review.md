# PATCH 0008 — Localiser le jeu en français

## Objectif
Rendre la V0 jouable entièrement en français côté utilisateur, sans modifier la logique moteur ni les identifiants techniques.

## Résultat
Interface, cartes, logs, effets, erreurs et choix interactifs entièrement en français. 83 tests passent (69 moteur + 14 i18n).

---

## Stratégie de traduction

- **Couche i18n séparée** : `src/i18n/fr.ts` (dictionnaire central), `src/i18n/renderEffect.ts` (rendu des effets), `src/i18n/index.ts` (point d'entrée).
- Les identifiants techniques TypeScript, les IDs de cartes et la structure du moteur sont inchangés.
- Les messages de log (`addLog`) dans les fichiers moteur ont été traduits — il s'agit de texte d'affichage, pas de logique métier.
- `getCardNameFr(definitionId)` : fonction centrale, fallback sur l'ID si la carte n'est pas dans le dictionnaire.
- `renderEffectFr(effect)` : rend tout type d'`Effect` en français, sans duplication dans les composants.

---

## Fichiers modifiés

### Nouveaux
| Fichier | Contenu |
|---|---|
| `src/i18n/fr.ts` | Dictionnaire complet : ressources, zones, actions, factions, types, UI, erreurs, noms des 50 cartes, libellés de choix, écran de démarrage |
| `src/i18n/renderEffect.ts` | `renderEffectFr(e: Effect): string` — tous les types d'effets |
| `src/i18n/index.ts` | Point d'entrée public (`fr`, `getCardNameFr`, `renderEffectFr`) |
| `src/tests/i18n.test.ts` | 14 tests de traduction |

### Interface utilisateur
| Fichier | Changements |
|---|---|
| `src/ui/CardDetailModal.tsx` | Noms FR, factions FR, types FR, effets FR, boutons FR, sections FR |
| `src/ui/PendingChoicePanel.tsx` | Libellés de choix FR, boutons FR, `renderEffectFr` |
| `src/ui/CardView.tsx` | Noms FR, badges FR (VAIS./BASE/AVP./UTILISÉ), résumé d'effets FR |
| `src/ui/GameBoard.tsx` | Toutes les étiquettes UI en FR (ressources, zones, boutons, état) |
| `src/ui/GameLog.tsx` | "Aucun événement.", J1/J2 |
| `src/App.tsx` | Écran de démarrage entièrement en FR |

### Moteur (logs uniquement)
| Fichier | Changements |
|---|---|
| `src/game/effects.ts` | 15 messages `addLog` traduits |
| `src/game/engine.ts` | 12 messages `addLog` traduits + noms de cartes FR via `getCardNameFr` |
| `src/game/choices.ts` | 9 messages `addLog` traduits + noms de cartes FR |
| `src/game/draw.ts` | 1 message `addLog` traduit |

---

## Traductions principales

| Terme anglais | Terme français |
|---|---|
| Authority | Autorité |
| Trade | Commerce |
| Combat | Combat |
| Deck | Pioche |
| Hand | Main |
| Discard | Défausse |
| Scrap | Écarter |
| Scrap Heap | Écart |
| Trade Row | Rangée commerciale |
| Ship | Vaisseau |
| Base | Base |
| Outpost | Avant-poste |
| Ally | Allié |
| Draw | Piocher |
| Game Over | Partie terminée |
| End Turn | Fin du tour |

## Preuves — tests ajoutés (14 nouveaux)

| Test | Résultat |
|---|---|
| Toutes les cartes ont un nom français affichable | ✅ |
| Ressources principales traduites (Autorité, Commerce, Combat) | ✅ |
| Actions principales traduites | ✅ |
| Zones traduites | ✅ |
| `renderEffectFr` — `gain_trade:3` → "+3 Commerce" | ✅ |
| `renderEffectFr` — `gain_combat:5` → "+5 Combat" | ✅ |
| `renderEffectFr` — `draw:1` → "Piochez 1 carte" / `draw:2` → "Piochez 2 cartes" | ✅ |
| `renderEffectFr` — `gain_authority` | ✅ |
| `renderEffectFr` — `opponent_discard` contient "défausse" | ✅ |
| Erreur `insufficient_trade` → "Commerce insuffisant." | ✅ |
| Erreur `outpost_blocking` contient "avant-poste" | ✅ |
| Tous les 17 codes `EngineError` ont une traduction | ✅ |
| Noms de cartes emblématiques corrects (scout, viper, stealth_needle...) | ✅ |
| Fallback sur l'ID pour carte inconnue | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 83 tests ✅ (2 fichiers) / build ✅

## Limites restantes
- Pas de sélecteur de langue (le français est la seule langue V0).
- Les noms de cartes en logs sont en français (traduction fonctionnelle, pas forcément officielle Star Realms FR).
- Certains noms anglais ont été conservés si intraduisibles sans ambiguïté (ex. "Cutter", "Dreadnaught").

## Hash du commit
`522a0a1`
