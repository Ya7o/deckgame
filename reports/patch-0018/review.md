# PATCH 0018 — Audit règles Star Realms / conformité moteur

## Objectif

Audit structuré du moteur de règles actuel. Aucune correction métier n'a été
faite dans ce patch. Tous les écarts trouvés sont listés avec une priorité et
seront traités dans des patchs séparés.

---

## 1. Périmètre audité

| Fichier | Lignes | Contenu |
|---|---|---|
| `src/game/types.ts` | 167 | Types, phases, zones, effets, choix, état |
| `src/game/engine.ts` | 370 | setupGame, playCard, activateBase, buy, attack, endTurn |
| `src/game/effects.ts` | 290 | Application des effets, alliés, Fleet HQ |
| `src/game/choices.ts` | 220 | Validation et résolution des choix |
| `src/game/bot.ts` | 200 | Heuristiques bot, résolution auto |
| `src/game/validators.ts` | 65 | Invariants d'état |
| `src/game/draw.ts` | 35 | Pioche + reshuffle |
| `src/game/utils.ts` | 120 | moveCard, shuffle, newId |
| `src/data/cards.ts` | 148 | Définitions cartes + parseur d'effets |
| `src/tests/*.ts` | ~800 | Couverture moteur, bot, UI |

---

## 2. Synthèse

| Zone | Verdict global | Nb écarts |
|---|---|---|
| Tour / main initiale | Conforme avec nuance | 1 P1 |
| Achat | Conforme | 0 |
| Combat | Conforme | 0 |
| Bases / avant-postes | Conforme | 0 |
| Effets alliés | Conforme | 0 |
| Choix joueur | P2 résiduel | 1 P2 |
| Choix bot | Conforme (avec dette) | 1 P3 |
| Invariants | Conformes | 0 |
| Cartes — effets | 1 carte incomplète | 1 P1 |
| Pioche / reshuffle | Conforme | 0 |
| Zones / instanceIds | Conformes | 0 |
| Phases GamePhase | 4 valeurs mortes | 1 P3 |
| Champs PlayerState | 2 champs inutilisés | 1 P3 |
| Codes d'erreur | 1 code incorrect | 1 P3 |
| Explorer pile | Limité à 10 | 1 P3 |
| Tests | Couverture satisfaisante | 0 |

---

## 3. Matrice d'audit

### 3.1 Structure du tour

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| P1 démarre le jeu | `currentPlayerId: "player_1"` | ✓ | — | |
| P1 pioche 3 au tour 1 | `drawCards(state, "player_1", 3)` | ⚠ | **P1** | Voir § 4.1 |
| P2 pioche 5 au tour 1 | `drawCards(state, "player_2", 5)` | ✓ | — | |
| Fin de tour : défausse vaiss. + main | `endTurn` déplace inPlay + hand → discard | ✓ | — | |
| Fin de tour : reset ressources | `currentTrade=0, currentCombat=0` | ✓ | — | |
| Fin de tour : débase non épuisée | `bases.map(b => { ...b, exhausted: false })` | ✓ | — | |
| Fin de tour : pioche 5 pour le prochain tour | `drawCards(s, playerId, 5)` | ✓ | — | |
| turnNumber incrémenté après P2 | `playerId === "player_2" ? +1 : unchanged` | ✓ | — | |
| Victoire : autorité ≤ 0 | `authority <= 0 → game_over` | ✓ | — | |
| Abandon | `concedeGame` → `winner = other` | ✓ | — | |

### 3.2 Achat

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Coût déduit du commerce | `currentTrade - def.cost!` | ✓ | — | |
| Commerce insuffisant → erreur | `player.currentTrade < def.cost!` | ✓ | — | |
| Carte achetée → défausse | `moveCard(card, "discard")` | ✓ | — | |
| Explorateur coût 2 | `player.currentTrade < 2` | ✓ | — | |
| Rangée rechargée après achat | `refillTradeRow()` | ✓ | — | |
| Modificateur prochain vaisseau top deck | `ActiveModifier → buyTradeRowCard` | ✓ | — | |
| Achat impossible hors tour | `guardTurn` | ✓ | — | |
| Achat impossible si choix en attente | `guardNoPending` | ✓ | — | |

### 3.3 Combat

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Combat suffisant pour base | `currentCombat >= defense` | ✓ | — | |
| Combat déduit après attaque base | `currentCombat - defense` | ✓ | — | |
| Combat suffisant pour joueur | `amount <= player.currentCombat` | ✓ | — | |
| Avant-poste bloque attaque directe | `hasOutpost → "outpost_blocking"` | ✓ | — | |
| Avant-poste détruit → attaque directe possible | Vérification live dans `attackOpponent` | ✓ | — | |
| Attaque positive entière | `isInteger(amount) && amount > 0` | ✓ | — | |
| Base détruite → défausse adversaire | `moveCard(base, "discard")` | ✓ | — | |
| Triggers/modifiers nettoyés à destruction | `activeTriggers.filter(...)` | ✓ | — | |

### 3.4 Bases et avant-postes

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Vaisseau → inPlay, Base → bases | `def.type === "ship"` dans `playCard` | ✓ | — | |
| Base ne déclenche pas effets au jeu | `def.type !== "ship"` → pas d'applyEffects | ✓ | — | |
| Exception : Fleet HQ trigger enregistré au jeu | `trigger_on_play_ship_gain_combat` → applyEffects | ✓ | — | |
| Mech World passif | `counts_as_ally_all_factions` via `hasMechWorldInPlay` | ✓ | — | |
| Base activable une fois par tour | `exhausted` flag, `base_already_exhausted` | ✓ | — | |
| Base réactivable au prochain tour | `endTurn → bases.map(b => { ...b, exhausted:false })` | ✓ | — | |
| Fleet HQ trigger persistant | Ré-enregistré dans `endTurn` si absent | ✓ | — | |
| Fleet HQ trigger non dupliqué | Check `already` | ✓ | — | |

### 3.5 Effets alliés

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Allié détecté si même faction en jeu/bases | `hasAlly` scan inPlay + bases | ✓ | — | |
| Effet allié déclenché une fois par tour par carte | `activatedAllyEffectsThisTurn` | ✓ | — | |
| Réévaluation à chaque carte jouée | `reapplyAllAllyEffects` | ✓ | — | |
| Aiguille Furtive copie effets + faction | `copy_another_ship_played_this_turn` | ✓ | — | |
| Mech World active tous les effets alliés | `hasMechWorldInPlay` dans `hasAlly` | ✓ | — | |
| Effets alliés après `activateBase` | `reapplyAllAllyEffects` dans `activateBase` | ✓ | — | |

### 3.6 Choix joueur

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Validation avant mutation | Bloc de validation séparé dans `resolveChoice` | ✓ | — | |
| `skip` uniquement pour optionnels | `!choice.optional → invalid_choice` | ✓ | — | |
| `choose_one` : index valide | `0 ≤ optionIndex < options.length` | ✓ | — | |
| Cartes valides ∈ candidateIds | Check `valid.has(id)` | ✓ | — | |
| `opponent_discard` : minimum non garanti | `payload.cardIds.length > amount` mais pas min | ✗ | **P2** | Voir § 4.2 |
| Choix appartient au bon joueur | `choice.playerId !== playerId → not_your_turn` | ✓ | — | |
| Brain World : pioche par carte écartée | `draw_per_card_scrapped_this_way` dans choices.ts | ✓ | — | |

### 3.7 Choix bot

| Règle | Implémentation | Verdict | Priorité | Note |
|---|---|---|---|---|
| Tous les types de choix traités | `chooseBotPayload` couvre tous les types | ✓ | — | |
| Bot défausse cartes les moins chères | `opponent_discard : sorted by cost` | ✓ | — | |
| Bot acquiert vaisseau le plus cher (gratuit) | `select_ship_to_acquire_free : max cost` | ✓ | — | |
| Bot scrap trade row : carte la moins chère | `select_trade_row_card_to_scrap : min cost` | ✓ | — | |
| Bot select_cards_to_scrap mandatory : envoie [] | Si `optional=false`, retourne `cardIds: []` | ⚠ | P3 | Cf. § 4.3 |
| Garde anti-boucle | `MAX_BOT_ACTIONS_PER_TURN = 200` | ✓ | — | |
| Résolution auto des choix en tête de boucle | `pendingChoices[0]` résolu en premier | ✓ | — | |

### 3.8 Invariants d'état

| Invariant | Implémentation | Verdict | Priorité |
|---|---|---|---|
| Pas de doublon instanceId | `validateStateInvariants` | ✓ | — |
| Ressources non négatives | `currentTrade >= 0, currentCombat >= 0` | ✓ | — |
| `tradeRow.length ≤ 5` | Validé dans `validateStateInvariants` | ✓ | — |
| Vaisseau ∉ bases, Base ∉ inPlay | Vérifié par type | ✓ | — |
| `winner set ↔ phase game_over` | Vérifié | ✓ | — |
| `currentPlayerId` valide | Vérifié | ✓ | — |
| Source de choix existant dans l'état | `seen.has(choice.sourceCardInstanceId)` | ✓ | — |

### 3.9 Pioche et reshuffle

| Règle | Implémentation | Verdict | Priorité |
|---|---|---|---|
| Pioche depuis deck en tête | `deck[0]` → hand | ✓ | — |
| Reshuffle automatique si deck vide | `shuffle(player.discard)` | ✓ | — |
| Reshuffle non déterministe | `Math.random` par défaut | ⚠ | P3 |
| Rand injectable via `SetupOptions.rand` | Disponible | ✓ | — |

### 3.10 Cartes — effets manquants ou incorrects

| Carte | Attendu | Implémenté | Verdict | Priorité |
|---|---|---|---|---|
| Dreadnaught | Allié : +5 Combat | Aucun effet allié | ✗ | **P1** |
| Explorateur (pile) | Quantité illimitée | Plafond 10 | ⚠ | P3 |
| Toutes autres cartes | Cf. core set | Conforme vérifié | ✓ | — |

---

## 4. Détails des écarts prioritaires

### 4.1 — P1 : P1 pioche 3 cartes au tour 1

```typescript
// engine.ts, setupGame
state = drawCards(state, "player_1", 3);
state = drawCards(state, "player_2", 5);
```

Dans les règles officielles de Star Realms, les deux joueurs piochent 5 cartes pour
leur premier tour. La limitation à 3 pour P1 est une variante fréquente utilisée
pour compenser l'avantage de commencer, mais elle n'est nulle part documentée dans
le projet comme un choix délibéré.

**Impact** : P1 est statistiquement désavantagé au premier tour.
**Correction proposée** : passer à 5, ou documenter explicitement le choix de 3.

### 4.2 — P2 : `opponent_discard` n'impose pas de minimum

```typescript
// choices.ts — validation opponent_discard
if (payload.cardIds.length > amount) return err(state, "invalid_choice");
// Pas de vérification de min(amount, hand.length)
```

Un joueur humain peut envoyer `{type:"select_cards", cardIds:[]}` même si son
adversaire lui a joué un Imperial Fighter. L'effet `opponent_discard` est censé
être obligatoire (défausser jusqu'à `amount` ou toutes si moins).

**Impact** : exploit possible via appel API direct ; pas reproductible via l'UI
actuelle car l'UI ne gère pas ce cas.
**Correction proposée** : ajouter `if (!choice.optional && payload.cardIds.length < Math.min(amount, candidateIds.length)) return err(state, "invalid_choice");`

### 4.3 — P3 : Bot scrap obligatoire envoie une sélection vide

```typescript
// bot.ts, chooseBotPayload
case "select_cards_to_scrap":
  if (choice.optional) return { type: "skip" };
  return { type: "select_cards", cardIds: [] };  // sélection vide = ne scrap rien
```

Si un effet de scrap obligatoire était ajouté (aucun dans le set actuel), le bot
ne scraperait rien. Actuellement sans impact car tous les effets `scrap_from_hand*`
dans le set de cartes sont `optional`.

### 4.4 — P1 : Dreadnaught manque son effet allié

```typescript
// cards.ts (raw data)
{ id: "dreadnaught", ..., ally_effects: "", ... }
```

Dans Star Realms (set de base), le Dreadnaught a un effet allié `+5 Combat`.
Cet effet est absent. Impact faible sur une partie ordinaire (1 Dreadnaught dans
le set), mais constitue une règle incomplète.

---

## 5. Dettes techniques (P3 — aucune urgence)

| Élément | Description |
|---|---|
| `GamePhase` valeurs mortes | `start_turn`, `resolving_choice`, `end_turn`, `setup` définies mais jamais assignées |
| `PlayerState.pendingDiscard` | Toujours 0, jamais utilisé (remplacé par PendingChoice `opponent_discard`) |
| `PlayerState.hasEndedTurn` | Initialisé à `false`, mis à `true` après endTurn, peu utilisé |
| `GameState.playerOrder` | Toujours `["player_1","player_2"]`, jamais itéré — rotation hardcodée |
| `activateSelfScrap` code d'erreur | Retourne `"card_not_in_hand"` quand la carte n'est pas en inPlay/bases |
| `next_ship_acquired_to_top_deck_optional` | Flag `optional` non utilisé — modificateur toujours enregistré |
| `draw.ts` reshuffle | Utilise `Math.random` si aucun `rand` n'est injecté — non déterministe hors tests |

---

## 6. Zones conformes

Les éléments suivants ont été vérifiés et ne présentent pas d'écart :

- Achat complet (coût, déduction, zone de destination, refill rangée)
- Combat (avant-poste, combat insuffisant, nettoyage triggers)
- Fleet HQ (trigger persistant, non dupliqué, nettoyé à destruction)
- Aiguille Furtive (copie effets + faction + réactivation alliés)
- Mech World (passif via `hasMechWorldInPlay`)
- Brain World (pioche par scrap)
- Blob World (choose_one)
- Recycling Station (choose_one)
- Acheteur gratuit de vaisseau (Blob Carrier allié)
- Modificateur top-deck (Central Office, Freighter allié)
- Effets auto-scrap (Explorer, Ram, Battlecruiser, etc.)
- Survey Ship scrap → opponent_discard
- Invariants d'état (duplicats, ressources négatives, zones, winner/phase)
- Seeded RNG dans tests (mulberry32)
- Résolution automatique de tous les choix bot

---

## 7. Couverture des tests existants

| Fichier | Tests | Zones couvertes |
|---|---|---|
| `engine.test.ts` | 69 | Achat, combat, bases, effets, choix, bot, invariants |
| `bot.test.ts` | 25 | Heuristiques bot, smoke tests |
| `i18n.test.ts` | 14 | Traductions |
| `gameboard.test.tsx` | 19 | UI : perspective, actions explicites, modal |

**Zones peu couvertes :**
- Scrap de la rangée commerciale + refill
- Aiguille Furtive (copy_another_ship_played_this_turn) avec allies
- Cas `authority <= 0` avec autorité exactement 0 vs négative
- `draw_if_two_or_more_bases` (Embassy Yacht) avec exactement 1 base
- Reshuffle pendant la pioche d'une main complète

---

## 8. Risques de régression

| Scénario | Risque |
|---|---|
| Ajout d'un scrap obligatoire | Bot envoie sélection vide — erreur silencieuse |
| Passage à 5 cartes P1 tour 1 | Peut modifier l'équilibre général |
| Correction `opponent_discard` minimum | Peut casser un test existant si test forge une sélection vide |

---

## 9. Patchs correctifs proposés

| Patch | Priorité | Titre | Contenu |
|---|---|---|---|
| **PATCH 0019** | P1 | Corriger Dreadnaught et documenter P1 draw 3 | Ajouter l'effet allié Dreadnaught ; décider et documenter le draw 3 P1 |
| **PATCH 0020** | P2 | Corriger `opponent_discard` minimum requis | Valider `cardIds.length >= min(amount, candidateIds.length)` si non optionnel |
| *(futur)* | P3 | Nettoyer champs morts PlayerState/GamePhase | `pendingDiscard`, `hasEndedTurn`, valeurs GamePhase, `playerOrder` |
| *(futur)* | P3 | Corriger code d'erreur activateSelfScrap | Retourner `"invalid_target"` au lieu de `"card_not_in_hand"` |
| *(futur)* | P3 | Explorer pile illimitée | Remplacer le tableau fixe par un générateur à la demande |
| *(futur)* | P3 | Gérer `next_ship_acquired_to_top_deck_optional` | Proposer un choix si le flag `optional` est vrai |

---

## 10. Aucune modification métier dans ce patch

Aucune règle de jeu, aucun coût, aucun effet et aucune heuristique bot n'ont été
modifiés dans ce patch. L'audit est strictement documentaire.

---

## 11. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 127 passed (69 moteur + 25 bot + 14 i18n + 19 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## Hash du commit

À compléter après commit.
