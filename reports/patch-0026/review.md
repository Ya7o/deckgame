# PATCH 0026 — Stabiliser l'UX mobile V0

## Objectif

Vérifier les 11 flux UX mobiles identifiés en B-06 (backlog PATCH 0023),
corriger les frictions P1/P2 trouvées, ajouter des tests jsdom pour les
6 flux non couverts.

---

## 1. Audit des 11 flux mobiles

| # | Flux | Couverture avant | Action PATCH 0026 |
|---|---|---|---|
| 1 | Démarrer une partie | Implicite (setupGame) | Test ajouté |
| 2 | Jouer une carte | ✅ PATCH 0016 | — |
| 3 | Consulter détail d'une carte | ✅ PATCH 0014/0016 | — |
| 4 | Acheter via bouton explicite | ✅ PATCH 0014 | — |
| 5 | Attaquer une base | ✗ Non couvert | Tests ajoutés |
| 6 | Attaquer le joueur adverse | ✗ Non couvert | Tests ajoutés |
| 7 | Activer une base | ✗ Non couvert | Fix + tests ajoutés |
| 8 | Résoudre un choix | Partiel (PATCH 0015) | — |
| 9 | Passer le tour | Partiel (état disabled) | Test ajouté |
| 10 | Observer le tour bot (UI bloquée) | ✅ PATCH 0013 | — |
| 11 | Voir victoire/défaite | ✗ Non couvert | Tests ajoutés |

---

## 2. Frictions corrigées

### P2 — Bases joueur activables sans badge visible (GameBoard.tsx)

**Avant** : Tap sur une base joueur dans la zone En jeu activait directement
la base OU ouvrait la modal (selon état exhausted). Pas de badge visuel
indiquant l'action disponible — inconsistant avec le pattern JOUER/ACHAT.

**Après** :
1. Badge "ACTIV." ajouté sur les bases non-exhausted (style empire, bas de
   carte), cohérent avec les badges JOUER/ACHAT/⊗.
2. Tap sur la carte elle-même ouvre toujours la modal (comme les cartes
   en main et la rangée commerciale) — l'action explicite est le bouton.
3. Le bouton "ACTIV." n'apparaît pas pendant le tour bot ni si pending choice.

### P1 — Modal d'activation pour base exhausted (GameBoard.tsx)

**Avant** : `onActivate` dans `CardDetailModal` ne vérifiait pas `selected.exhausted`.
Une base exhausted pouvait afficher un bouton "Activer" non fonctionnel dans
la modal (le moteur rejette mais l'utilisateur ne comprend pas pourquoi).

**Après** : Condition `!selected.exhausted` ajoutée → bouton "Activer" absent
pour les bases épuisées.

---

## 3. Tests ajoutés

**Fichier** : `src/tests/gameboard.test.tsx`

| Describe | Tests |
|---|---|
| Flow 1 — setupGame état valide | 1 |
| Flow 5 — Attaquer une base | 2 |
| Flow 6 — Attaquer le joueur adverse | 3 |
| Flow 7 — Activer une base (badge ACTIV.) | 4 |
| Flow 9 — Passer le tour | 1 |
| Flow 11 — Écran fin de partie | 2 |

**Total ajouté** : 13 tests

---

## 4. Résultats

```
Avant PATCH 0026 : 177 tests
Après PATCH 0026 : 190 tests (+13 nouveaux)
  gameboard.test.tsx : 19 → 32 (+13)
Lint : 0 erreur
Build : OK
TypeScript : 0 erreur
```

---

## 5. Flux non couverts (hors scope)

- **Flow 8 (Résoudre un choix choose_one)** : La PendingChoicePanel est
  testée pour l'affichage (PATCH 0015). La résolution interactive via jsdom
  est complexe (useState interne). Le comportement moteur est couvert à 100%
  par engine.test.ts. Reporté en dette B-16 si nécessaire.
- Playwright non disponible (Ubuntu 26.04) : tests e2e manuels uniquement.

---

## 6. Items du backlog traités

| Item | Priorité | Statut |
|---|---|---|
| B-06 — Flux mobile à vérifier | P2 | ✅ Résolu |

Items restants : B-07 à B-15 (PATCH 0027).

---

## Hash du commit

- b8d3329
