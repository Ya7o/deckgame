# PATCH 0025 — Durcir la QA V0

## Objectif

Couvrir les zones sous-testées identifiées en B-04 et augmenter la taille du
batch de simulation de 50 à 100 parties (B-05).

---

## 1. Nouvelles couvertures QA

### B-04 — Zones peu couvertes

#### draw_if_two_or_more_bases (Embassy Yacht)

**Fichier** : `src/tests/engine.test.ts`
**Tests ajoutés** : 3

| Cas | Résultat attendu |
|---|---|
| 0 bases en jeu | Pas de pioche (hand -= 1) |
| 1 base en jeu | Pas de pioche (< 2 bases) |
| 2 bases en jeu | Pioche 2 cartes (hand += 1 net) |

Vérification du seuil exact `>= 2` de l'effet `draw_if_two_or_more_bases`.

#### scrap_trade_row + refill (Battle Pod)

**Tests ajoutés** : 2

| Cas | Résultat attendu |
|---|---|
| Résolution avec sélection | Carte retirée, rangée rechargée |
| Skip (optionnel) | Choice retiré sans erreur |

L'effet `scrap_trade_row:1_optional` crée un `PendingChoice` de type
`select_trade_row_card_to_scrap` avec `optional: true`. Après résolution,
`refillTradeRow` est appelé et la rangée conserve sa taille.

#### Authority edge cases

**Tests ajoutés** : 2

| Cas | Résultat attendu |
|---|---|
| Attaque réduit authority à exactement 0 | `phase === "game_over"`, authority === 0 |
| Attaque overkill (authority négative) | `phase === "game_over"`, authority <= 0 |

Couvre la condition `authority <= 0` du moteur avec les deux sous-cas.

#### Reshuffle pendant pioche complète

**Tests ajoutés** : 1

Deck vide + 3 cartes en défausse → `endTurn` déclenche un reshuffle et
constitue une nouvelle main (au moins 1 carte).

---

### B-05 — Augmentation du batch de simulation

**Fichier** : `src/tests/balance.test.ts`
**Tests ajoutés** : 5 (describe PATCH 0025, seeds 2000-2099)

Batch porté de 50 à 100 parties pour le jeu de tests de balance.
Les seeds 2000-2099 évitent tout overlap avec les seeds existants
(PATCH 0019 : 1-50, PATCH 0020 : 1000-1049, PATCH 0021 : 1-50).

Seuils conservés : 0 erreur moteur, 0 violation d'invariant,
maxTurnsHit ≤ 5%, winRateP1 < 70%, avgTurns < 80.

---

## 2. Résultats

```
Avant PATCH 0025 : 164 tests
Après PATCH 0025 : 177 tests (+13 nouveaux)
  engine.test.ts : 76 → 84 (+8)
  balance.test.ts : 6 → 11 (+5)
Lint : 0 erreur
Build : OK
```

Détail des describes ajoutés :
- `PATCH 0025 — Embassy Yacht draw_if_two_or_more_bases` (3 tests)
- `PATCH 0025 — scrap_trade_row + refill` (2 tests)
- `PATCH 0025 — authority edge cases` (2 tests)
- `PATCH 0025 — reshuffle pendant pioche complète` (1 test)
- `PATCH 0025 — Seuils de stabilite 100 parties (B-05)` (5 tests)

---

## 3. Items du backlog traités

| Item | Priorité | Statut |
|---|---|---|
| B-04 — Zones peu couvertes | P2 | ✅ Résolu |
| B-05 — Batch simulation trop court | P2 | ✅ Résolu |

Items restants : B-06 à B-15 (PATCH 0026-0027).

---

## 4. Limites

- Le test "reshuffle pendant pioche complète" n'asserte pas que la défausse
  est vide après reshuffle (comportement non déterministe si discard > hand_size).
  L'assertion `hand.length > 0` est suffisante pour valider le chemin code.
- Les reshuffles utilisent `Math.random` (non déterministe). B-12 reste
  ouvert pour PATCH 0027.

---

## Hash du commit

- A remplir après git push
