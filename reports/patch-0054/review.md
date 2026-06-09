# PATCH 0054 — Clarifier le vocabulaire de jeu et les microcopies

**Date :** 2026-06-09
**Commit :** d45350f
**Branche :** master
**Tests unitaires :** 292 / 292 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Clarifier les termes du jeu visibles dans l'UI, rendre les effets de cartes plus
lisibles, et ajouter un glossaire accessible directement depuis la partie.

---

## Modifications apportées

### A. `deckgame/src/i18n/fr.ts`

**Nouveaux champs `fr.ui` :**
```ts
allyHint: "même faction jouée ce tour",
scrapHint: "retire définitivement de la partie",
glossaryTitle: "Glossaire",
glossaryBtn: "?",
```

**Nouveau tableau `fr.glossary` (11 entrées) :**

| Terme | Définition |
|---|---|
| Main | Cartes que vous pouvez jouer ce tour. |
| Pioche | Votre deck — mélangé à nouveau quand il est vide. |
| Défausse | Cartes jouées/achetées ce tour, remélangées en fin de tour suivant. |
| Écarter | Retirer définitivement une carte de la partie (hors défausse et deck). |
| Défausser | Mettre une carte dans la défausse. |
| Effet allié | Bonus actif si au moins une carte de la même faction a été jouée ce tour. |
| Base | Reste en jeu entre les tours — donne des effets récurrents. |
| Avant-poste | Base avec des points de défense — doit être détruite avant d'attaquer directement. |
| Commerce | Permet d'acheter des cartes dans la rangée commerciale. |
| Combat | Permet d'attaquer l'adversaire ou ses bases. |
| Autorité | Vos points de vie — tomber à 0 = défaite. |

### B. `deckgame/src/ui/CardDetailModal.tsx`

Section "Allié" : titre enrichi avec `· même faction jouée ce tour`
```
Avant : Allié — Blob
Après : Allié — Blob · même faction jouée ce tour
```

Section "Écart" : titre enrichi avec `— retire définitivement de la partie`
```
Avant : Écart
Après : Écart — retire définitivement de la partie
```

### C. `deckgame/src/ui/GameBoard.tsx`

**Bouton `?` ajouté dans les deux layouts :**
- Portrait : dans la barre inférieure (entre Plein écran et Abandonner)
- Landscape : dans la colonne d'actions (après Plein écran)
- `aria-label="Glossaire"` pour l'accessibilité

**Panneau glossaire (GlossaryPanel inline) :**
- Overlay bottom-sheet (même style que CardDetailModal)
- Fond semi-transparent, border-radius 12px 12px 0 0
- Liste des 11 termes avec définitions, termes en couleur accent
- zIndex: 200 (au-dessus de tout)
- Fermeture par clic sur l'overlay ou bouton ✕

### D. `docs/user-guide-v0.1.md`

Section Glossaire ajoutée en fin de guide avec le tableau complet des termes.
Note sur le bouton `?` en jeu.

---

## Tests unitaires ajoutés (6 — total 292)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0054 A | Bouton ? présent portrait | ✅ |
| PATCH 0054 A | Clic ? ouvre glossaire avec titre | ✅ |
| PATCH 0054 A | Glossaire contient 'Main' avec définition | ✅ |
| PATCH 0054 A | Glossaire contient 'Écarter' avec définition | ✅ |
| PATCH 0054 B | Landscape : bouton ? présent | ✅ |
| PATCH 0054 B | Landscape : glossaire contient Effet allié | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Portrait : bouton ? présent | 390×844 | ✅ |
| A2 — Portrait : clic ? ouvre le glossaire | 390×844 | ✅ |
| A3 — Portrait : terme Écarter expliqué | 390×844 | ✅ |
| B1 — Paysage : bouton ? présent | 844×390 | ✅ |
| B2 — Paysage : glossaire contient Effet allié | 844×390 | ✅ |

---

## Sécurité gameplay

- Aucune modification moteur / règles / cartes ✅
- Aucune carte ni mécanique ajoutée ✅
- Seuls fr.ts (i18n) + UI (GameBoard, CardDetailModal) + doc modifiés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/i18n/fr.ts` | allyHint, scrapHint, glossaryTitle, glossaryBtn, fr.glossary |
| `deckgame/src/ui/CardDetailModal.tsx` | Titres sections Allié et Écart clarifiés |
| `deckgame/src/ui/GameBoard.tsx` | Bouton ? + GlossaryPanel portrait + landscape |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0054 |
| `deckgame/e2e/patch-0054.spec.ts` | Nouveau — 5 tests Playwright |
| `docs/user-guide-v0.1.md` | Section Glossaire ajoutée |
| `reports/patch-0054/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (292 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| Bouton glossaire accessible en jeu | ✅ |
| Termes pédagogiques (Main, Pioche, Défausse...) | ✅ |
| CardDetailModal Allié/Écart clarifiés | ✅ |
| Guide utilisateur mis à jour | ✅ |
| Gameplay modifié | ✅ Non |
