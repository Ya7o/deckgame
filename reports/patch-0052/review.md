# PATCH 0052 — Optimiser le layout paysage plein écran

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests unitaires :** 280 / 280 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Optimiser le layout paysage pour l'expérience plein écran cible V0.2 :
lisibilité améliorée, hiérarchie des actions clarifiée, espace mieux utilisé.

---

## Modifications apportées (GameBoard.tsx — section landscape)

### A. Trade row label : 10px → 9px, compteurs fusionnés

Avant : 2 spans séparés sur une ligne de 10px + marginBottom: 2px
Après : 1 ligne de 9px + marginBottom: 1px → économie ~3px verticaux

### B. EN JEU cards : 46×48px → 52×56px

Les cartes dans la zone EN JEU (vaisseaux joués + bases) étaient trop petites
pour être lues à l'œil. 52×56px offre une meilleure lisibilité sans exploser l'espace.
(Concerne inPlay et bases du joueur — 2 occurrences remplacées)

### C. Barre de ressources : suppression deck/discard

La ligne `Pioche X · Défausse X` dans la barre de ressources surchargeait la zone
actions. Déplacée dans le label de la main (section HAND).

### D. Boutons actions : Fin du tour en premier

Avant : [Attaquer?] [Avant-poste?] [Journal] [Fin du tour] [Abandonner] [Plein écran]
Après : [Fin du tour] [Journal] [Attaquer?] [Avant-poste?] [Abandonner] [Plein écran]

Fin du tour = action principale → placée en tête, `fontWeight: bold`.
Attaque = action contextuelle → placée après Journal.

### E. Label MAIN : ajout Pioche/Défausse

```
MAIN — Joueur 1 (T.X) · 5 cartes  Pioche X · Défausse X
```

Les compteurs deck/discard sont désormais dans le header de la main (opacity 0.5, 9px)
plutôt que dans la barre de ressources.

---

## Portrait non régressé

- Portrait layout intact, Fin du tour 44px ✅
- Tests portrait existants tous verts ✅

---

## Tests unitaires ajoutés (6 — total 280)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0052 A | Landscape EN JEU présent | ✅ |
| PATCH 0052 A | Landscape Fin du tour présent | ✅ |
| PATCH 0052 A | Landscape Journal présent | ✅ |
| PATCH 0052 A | Landscape MAIN présent | ✅ |
| PATCH 0052 B | Portrait data-layout=portrait | ✅ |
| PATCH 0052 B | Portrait Fin du tour ≥ 44px | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Début paysage, toutes zones visibles | 844×390 | ✅ |
| A2 — Fin du tour en premier | 844×390 | ✅ |
| A3 — Journal overlay, MAIN toujours visible | 844×390 | ✅ |
| A4 — Section EN JEU présente | 844×390 | ✅ |
| B1 — Portrait intact | 390×844 | ✅ |

---

## Sécurité gameplay

- Aucune modification moteur / règles / cartes ✅
- Seuls styles CSS inline et ordre des boutons modifiés ✅
- Gameplay et logique inchangés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Layout paysage : label, EN JEU cards, ressources, ordre boutons |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0052 |
| `deckgame/e2e/patch-0052.spec.ts` | Nouveau — 5 tests Playwright |
| `reports/patch-0052/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (280 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| Layout paysage amélioré | ✅ |
| Portrait non régressé | ✅ |
| Gameplay modifié | ✅ Non |
