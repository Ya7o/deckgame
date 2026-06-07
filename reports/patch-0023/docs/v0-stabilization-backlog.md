# Backlog de stabilisation V0

> Document créé par PATCH 0023 — 2026-06-07
> Exploitable directement par PATCH 0024 à 0030.

---

## Matrice de priorité

| ID | Priorité | Zone | Description | Patch cible | Impact |
|---|---|---|---|---|---|
| B-01 | **P1** | Règles/Cartes | Dreadnaught : effet allié +5 Combat absent | 0024 | Règle incorrecte |
| B-02 | **P1** | Moteur/Choix | opponent_discard : minimum non validé | 0024 | Exploit possible |
| B-03 | **P2** | Règles/Tour | Règle P1 draw-3 : non documentée comme intentionnelle | 0024 | Ambiguïté règles |
| B-04 | **P2** | QA | Zones peu couvertes par les tests (voir détails) | 0025 | Régression silencieuse |
| B-05 | **P2** | QA | Tests de simulation trop courts (50 parties) | 0025 | Faux positifs |
| B-06 | **P2** | UX mobile | Vérification complète flux mobile (10 scénarios) | 0026 | Jouabilité V0 |
| B-07 | **P3** | Dette | GamePhase : 4 valeurs mortes (start_turn, end_turn, etc.) | 0027 | Clarté code |
| B-08 | **P3** | Dette | PlayerState.pendingDiscard : toujours 0, jamais utilisé | 0027 | Clarté code |
| B-09 | **P3** | Dette | PlayerState.hasEndedTurn : peu utilisé | 0027 | Clarté code |
| B-10 | **P3** | Dette | GameState.playerOrder : jamais itéré | 0027 | Clarté code |
| B-11 | **P3** | Dette | activateSelfScrap code erreur incorrect | 0027 | Cohérence erreurs |
| B-12 | **P3** | Simulation | Reshuffles non déterministes (Math.random) | 0027 | Tests non reproductibles à 100% |
| B-13 | **P3** | Règles | Explorer pile illimitée vs plafond 10 | 0027 | Conformité règles |
| B-14 | **P3** | CI | Vérifier cohérence des rapports 0001–0022 | 0027 | Cohérence repo |
| B-15 | **P2** | Docs | README absent ou incomplet | 0027 | Onboarding |

---

## Détails des items P1

### B-01 — Dreadnaught : effet allié absent

**Localisation** : `src/data/cards.ts`, ligne 39
**État actuel** :
```typescript
{ id: "dreadnaught", ..., ally_effects: "", ... }
```
**Correction cible** :
```typescript
{ id: "dreadnaught", ..., ally_effects: "gain_combat:5", ... }
```
**Test à ajouter** : vérifier qu'avec un Dreadnaught en jeu + autre vaisseau Star Empire, +5 combat s'applique.
**Risque** : faible — ajout d'un effet inexistant.

---

### B-02 — opponent_discard minimum non validé

**Localisation** : `src/game/choices.ts`, case `opponent_discard` (validation)
**État actuel** :
```typescript
if (payload.cardIds.length > amount) return err(state, "invalid_choice");
// Manque : vérification du minimum obligatoire
```
**Correction cible** :
```typescript
const minRequired = choice.optional ? 0 : Math.min(amount, candidateIds.length);
if (payload.cardIds.length < minRequired) return err(state, "invalid_choice");
```
**Test à ajouter** : vérifier qu'envoyer `cardIds: []` pour un opponent_discard obligatoire retourne une erreur.
**Risque** : peut casser un test existant si un test forge une sélection vide — vérifier.

---

### B-03 — Règle P1 draw-3

**Localisation** : `src/game/engine.ts`, `setupGame`
**État actuel** : P1 pioche 3 cartes au tour 1. Non documenté comme règle intentionnelle.
**Options** :
1. **Documenter** : ajouter un commentaire expliquant la règle de compensation
2. **Corriger** : passer à 5 pour les deux joueurs (règles officielles)
**Simulation PATCH 0022** : P1 gagne 53-54.8% avec draw-3. Si on passe à 5, P1 avantage pourrait augmenter.
**Recommandation** : documenter explicitement le draw-3 comme règle de compensation intentionnelle V0.
**Action PATCH 0024** : ajouter un commentaire explicatif + test qui documente le comportement attendu.

---

## Détails des items P2 (QA)

### B-04 — Zones insuffisamment couvertes

Identifiées dans PATCH 0018 :
- Scrap depuis la rangée commerciale + refill
- Aiguille Furtive (copy_another_ship_played_this_turn) avec alliés
- authority === 0 exact vs négatif
- draw_if_two_or_more_bases avec exactement 1 base (Embassy Yacht)
- Reshuffle pendant pioche d'une main complète

**Action PATCH 0025** : ajouter des tests ciblés pour chacune.

### B-05 — Batch de simulation trop court

Le test balance.test.ts utilise 50 parties. Marge d'erreur ≈ ±7%.
**Action PATCH 0025** : augmenter à 100 parties minimum ou ajouter un test séparé à 200 parties.

---

## Détails des items P2 (UX mobile)

### B-06 — Flux mobile à vérifier

Flux à valider manuellement ou via Preview MCP :
1. Démarrer une partie
2. Jouer une carte
3. Consulter le détail d'une carte (tap = détail)
4. Acheter via bouton explicite
5. Attaquer une base
6. Attaquer le joueur adverse
7. Activer une base
8. Résoudre un choix (choose_one, select_cards)
9. Passer le tour
10. Observer le tour bot (UI bloquée)
11. Voir victoire/défaite

**Action PATCH 0026** : parcourir ces flux, corriger les frictions P1/P2.

---

## Mapping patchs → items

| Patch | Items traités |
|---|---|
| PATCH 0024 | B-01, B-02, B-03 |
| PATCH 0025 | B-04, B-05 |
| PATCH 0026 | B-06 |
| PATCH 0027 | B-07, B-08, B-09, B-10, B-11, B-12, B-13, B-14, B-15 |
| PATCH 0028 | Validation RC (tous items) |
| PATCH 0029 | Corrections RC si nécessaire |
| PATCH 0030 | Tag V0 + documentation finale |
