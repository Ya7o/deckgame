# PATCH 0048 — Accessibilité + confort tactile

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests unitaires :** 274 / 274 GREEN
**Playwright :** 9 / 9 GREEN

---

## Objectif

Améliorer le confort tactile mobile en augmentant les zones de touch des boutons
primaires, et renforcer l'accessibilité (aria-labels manquants).

---

## Corrections apportées (GameBoard.tsx)

### A. Portrait — touch targets

| Bouton | Avant | Après | Cible |
|---|---|---|---|
| Journal (toggle) | `minHeight: 34px` | `minHeight: 44px` | ≥ 44px ✅ |
| Fin du tour | `minHeight: 34px` | `minHeight: 44px` | ≥ 44px ✅ |
| Abandonner | `minHeight: 22px` | `minHeight: 32px` | secondaire ✅ |
| Fermer journal × | `minHeight: 24px` | `minHeight: 36px`, `minWidth: 36px` | ≥ 32px ✅ |

### B. Landscape — touch targets + aria-label

| Bouton | Avant | Après |
|---|---|---|
| Journal (toggle) | `minHeight: 30px` | `minHeight: 36px` |
| Fin du tour | `minHeight: 30px` | `minHeight: 36px` |
| Attaquer | `minHeight: 30px` | `minHeight: 36px` |
| Overlay ✕ journal | aucun `aria-label` | `aria-label="Fermer le journal"` |

Le bouton ✕ du journal landscape avait déjà `minWidth/minHeight: 44px` — conservé.

---

## Boutons non modifiés (intentionnellement)

| Bouton | Taille | Raison |
|---|---|---|
| Abandonner landscape | `minHeight: 18px` | Action irréversible — taille réduite intentionnelle |
| Plein écran compact | `minHeight: 18px` | Bouton optionnel secondaire |
| Badges JOUER/Acheter | `auto` | Overlay sur cartes — contrainte graphique |
| Boutons CardDetailModal | CSS class | `minHeight` géré par classes `.primary`, `.danger` |

---

## Tests unitaires ajoutés (6 tests — total 274)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0048 A | Portrait Journal minHeight ≥ 44 | ✅ |
| PATCH 0048 A | Portrait Fin du tour minHeight ≥ 44 | ✅ |
| PATCH 0048 A | Portrait close × minHeight ≥ 32 | ✅ |
| PATCH 0048 B | Landscape Journal minHeight ≥ 36 | ✅ |
| PATCH 0048 B | Landscape Fin du tour minHeight ≥ 36 | ✅ |
| PATCH 0048 B | Landscape × aria-label | ✅ |

---

## Playwright 9 / 9

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Journal portrait hauteur ≥ 44px | 390×844 | ✅ |
| A2 — Fin du tour portrait hauteur ≥ 44px | 390×844 | ✅ |
| A3 — Close × portrait hauteur ≥ 32px | 390×844 | ✅ |
| B1 — Journal landscape hauteur ≥ 36px | 844×390 | ✅ |
| B2 — Fin du tour landscape hauteur ≥ 36px | 844×390 | ✅ |
| B3 — Landscape × aria-label présent | 844×390 | ✅ |
| B4 — Landscape × taille ≥ 44×44px | 844×390 | ✅ |
| C1 — Fin du tour gameplay OK | 390×844 | ✅ |
| C2 — Journal open/close cycle | 390×844 | ✅ |

---

## Sécurité gameplay

- Aucune modification moteur / règles / cartes ✅
- Seuls les styles CSS inline (minHeight) et aria-labels modifiés ✅
- Gameplay inchangé ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Touch targets + aria-label landscape × |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0048 |
| `deckgame/e2e/patch-0048.spec.ts` | Nouveau — 9 tests Playwright |
| `reports/patch-0048/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (274 tests + build) | ✅ GREEN |
| Playwright 9 tests | ✅ 9/9 |
| Touch targets portrait ≥ 44px | ✅ Journal + Fin du tour |
| Touch targets landscape ≥ 36px | ✅ Journal + Fin du tour + Attaquer |
| aria-label landscape × | ✅ Ajouté |
| Gameplay modifié | ✅ Non |
