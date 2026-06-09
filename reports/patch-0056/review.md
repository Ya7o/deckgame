# PATCH 0056 — Harmoniser la barre d'actions et les boutons critiques

**Date :** 2026-06-09
**Commit :** 842d2f7
**Branche :** master
**Tests unitaires :** 305 / 305 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Harmoniser la hiérarchie visuelle des boutons : Fin du tour = primaire dominant,
Abandonner = secondaire discret, états désactivés explicites.

---

## Modifications apportées

### A. `deckgame/src/i18n/fr.ts`

```ts
endTurnTitlePending: "Résolvez d'abord le choix en attente",
endTurnTitleBot: "Tour du bot en cours…",
```

### B. `deckgame/src/ui/GameBoard.tsx`

**Portrait — Fin du tour :**
- Ajout `title={hasPendingForMe ? fr.ui.endTurnTitlePending : isBotTurn ? fr.ui.endTurnTitleBot : undefined}`
- Explication accessible quand le bouton est désactivé

**Portrait — Abandonner :**
| Avant | Après |
|---|---|
| `minHeight: "32px"` | `minHeight: "22px"` |
| `border: "1px solid rgba(255,85,85,0.25)"` | `border: "1px solid var(--border)"` |
| `opacity: 0.8` | `opacity: 0.6` |

Résultat : Abandonner est désormais à la même hauteur que Plein écran et ?,
avec une bordure neutre — il reste accessible mais ne domine plus visuellement.

**Landscape — Fin du tour :**
- Même ajout du `title` pour l'état désactivé

---

## Hiérarchie finale

| Bouton | Classe CSS | Portrait | Landscape |
|---|---|---|---|
| Fin du tour | primary | 44px | 36px |
| ⚔ Attaquer | danger | 44px | 36px |
| Journal | plain | 44px | 36px |
| Activer | custom | auto | (via modale) |
| Plein écran | plain secondary | 22px | 18px |
| ? Glossaire | plain secondary | 22px | 18px |
| Abandonner | plain secondary | **22px** | 18px |

---

## Tests unitaires ajoutés (7 — total 305)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0056 A | Fin du tour primary ≥ 44px | ✅ |
| PATCH 0056 A | Abandonner < 44px | ✅ |
| PATCH 0056 A | Fin du tour désactivé bot a title | ✅ |
| PATCH 0056 A | Journal présent | ✅ |
| PATCH 0056 B | Landscape Fin du tour primary | ✅ |
| PATCH 0056 B | Landscape Fin du tour désactivé a title | ✅ |
| PATCH 0056 B | Landscape Abandonner pas primary | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Portrait : boutons principaux visibles | 390×844 | ✅ |
| A2 — Portrait : Abandonner < Fin du tour (hauteur) | 390×844 | ✅ |
| A3 — Portrait : Fin du tour désactivé pendant bot | 390×844 | ✅ |
| B1 — Paysage : boutons principaux visibles | 844×390 | ✅ |
| B2 — Paysage : Fin du tour désactivé pendant bot | 844×390 | ✅ |

---

## Sécurité gameplay

- Aucune action retirée ✅
- Abandonner reste accessible ✅
- Moteur / règles / cartes inchangés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/i18n/fr.ts` | endTurnTitlePending, endTurnTitleBot |
| `deckgame/src/ui/GameBoard.tsx` | Fin du tour title + Abandonner harmonisé |
| `deckgame/src/tests/gameboard.test.tsx` | +7 tests PATCH 0056 |
| `deckgame/e2e/patch-0056.spec.ts` | Nouveau — 5 tests Playwright |
| `reports/patch-0056/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (305 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| Abandonner moins dominant | ✅ |
| États désactivés explicites | ✅ |
| Portrait non régressé | ✅ |
| Gameplay modifié | ✅ Non |
