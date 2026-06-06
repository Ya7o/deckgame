# PATCH 0005 — Ajouter validateStateInvariants

## Objectif
Créer `validateStateInvariants(state)` pour détecter les états corrompus : cartes en double zone, ressources négatives, incohérences structurelles.

## Corrections apportées

### `src/game/validators.ts` (nouveau fichier)
Fonction `validateStateInvariants(state: GameState): ValidationError[]` qui vérifie :

| Invariant | Description |
|---|---|
| Aucun `instanceId` dupliqué | = aucune carte dans deux zones simultanément |
| `currentTrade >= 0` | par joueur |
| `currentCombat >= 0` | par joueur |
| `tradeRow.length <= 5` | plafond de la rangée commerciale |
| Aucune Base dans `inPlay` | les bases vont dans `bases`, pas `inPlay` |
| Aucun Ship dans `bases` | les vaisseaux vont dans `inPlay`, pas `bases` |
| `winner !== null` → `phase === "game_over"` | cohérence fin de partie |
| `currentPlayerId` référence un joueur valide | guard contre la corruption de state |
| Chaque `pendingChoice.sourceCardInstanceId` existe | la source du choix est toujours localisable |

Zones inspectées : `tradeDeck`, `tradeRow`, `explorerPile`, `scrapHeap`, plus toutes les zones de chaque joueur (`deck`, `hand`, `discard`, `inPlay`, `bases`).

## Preuves — tests ajoutés (8 nouveaux)

| Test | Résultat |
|---|---|
| État valide après `setupGame` | ✅ |
| État valide après `playCard` (ship) | ✅ |
| État valide après `buyTradeRowCard` | ✅ |
| État valide après `attackOpponent` | ✅ |
| État valide après `endTurn` | ✅ |
| Détection : `instanceId` dupliqué (carte dans deux zones) | ✅ |
| Détection : `currentTrade` négatif | ✅ |
| Détection : `winner` sans `phase === "game_over"` | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 63 tests ✅ / build ✅

## Hash du commit
À compléter après commit.
