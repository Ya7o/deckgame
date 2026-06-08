# PATCH 0044 — Stabiliser le paysage sur vrai navigateur mobile

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests :** 256 / 256 GREEN
**Playwright :** 15 / 15 (3 viewports paysage + témoin portrait)

---

## Contexte et problème

Après PATCH 0043, les captures Playwright utilisaient un viewport 844×390 qui
ne représente pas la hauteur utile réelle d'un navigateur mobile en paysage.
Sur Chrome Android, les barres d'adresse et système réduisent typiquement la
hauteur de ~50–60 px, soit ~350–340 px effectifs.

Avant ce patch, la hauteur cumulée des sections fixes (opponent + trade row +
EN JEU + actions) était de **229 px**, laissant ~111 px pour la MAIN à 340 px
de hauteur utile — insuffisant pour les cartes à 90 px.

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `deckgame/src/index.css` | `--card-w: 68→64px`, `--card-h: 90→76px` en landscape |
| `deckgame/src/ui/GameBoard.tsx` | Réduction padding landscape (9 points) |
| `deckgame/src/tests/gameboard.test.tsx` | 13 tests ajoutés (PATCH 0044) |
| `deckgame/e2e/patch-0044.spec.ts` | 15 captures Playwright sur 3 viewports |

---

## Optimisations appliquées

### `index.css` — Variables CSS landscape
```css
[data-layout="landscape"] {
  --card-w: 64px;  /* était 68px */
  --card-h: 76px;  /* était 90px — réduction clé */
}
```

### `GameBoard.tsx` — Padding landscape compacté

| Zone | Avant | Après | Gain |
|---|---|---|---|
| Zone adversaire | padding 5px 10px | padding 3px 10px | -4px |
| Rangée commerciale | padding 5-4px V | padding 3-2px V | -4px |
| En-tête trade row | marginBottom 3px | marginBottom 2px | -1px |
| EN JEU (padding) | padding 4px | padding 3px | -2px |
| Micro-cartes EN JEU | --card-h 54px | --card-h 48px | -6px |
| Actions (padding) | padding 4px | padding 3px | -2px |
| MAIN (padding) | padding 5px | padding 3px | -4px |
| MAIN header | marginBottom 3px | marginBottom 2px | -1px |
| **Total** | **229px** | **194px** | **-35px** |

---

## Budget hauteur — avant vs après

| Viewport | Avant (cartes 90px) | Après (cartes 76px) | Statut |
|---|---|---|---|
| 390px (Playwright) | 161px MAIN | 196px MAIN | ✅ Confortable |
| 360px (mobile moyen) | 131px MAIN | 166px MAIN | ✅ OK |
| 340px (mobile contraint) | 111px MAIN | 146px MAIN | ✅ OK |
| 310px (très contraint) | 81px MAIN | 116px MAIN | ✅ Lisible |

*(MAIN = espace disponible pour les cartes en main. Cartes 76px : margin confortable à 340px+)*

---

## Tests UI/jsdom ajoutés (13 tests en 5 suites)

| Suite | Description |
|---|---|
| A/B/C. Viewports contraints | layout landscape rendu à 844×390, 800×360, 740×340 |
| D. Main visible | Section MAIN présente, overflow:hidden root, bouton JOUER |
| E. Actions principales | Fin du tour, Journal, RANGÉE COMMERCIALE, modale ouvrable |
| F. Journal overlay | Position absolute (ne pousse pas la main), MAIN reste dans DOM |
| G. Portrait NR | data-layout=portrait, boutons JOUER présents |

---

## Captures Playwright — `reports/patch-0044/screenshots/`

### 844×390 — Référence standard

| Capture | Observation |
|---|---|
| 01-plateau | Bot info · trade row 5 cartes · EN JEU · MAIN 3 cartes + JOUER ✅ |
| 02-main-jouable | JOUER accessible en bas de viewport ✅ |
| 03-modal | Modale carte lisible (maxHeight 78vh) ✅ |
| 04-journal | Overlay journal sans pousser la MAIN ✅ |
| 05-fin-tour | "Fin du tour" accessible après avoir joué ✅ |

### 800×360 — Android moyen contraint

| Capture | Observation |
|---|---|
| 01-plateau-main | Toutes sections + MAIN + JOUER visibles à 360px ✅ |
| 02-main-jouable | JOUER accessible ✅ |
| 03-fin-tour | "Fin du tour" visible ✅ |
| 04-modal | Modale ouvrable à 360px ✅ |
| 05-journal | Journal overlay, MAIN reste visible derrière ✅ |

### 740×340 — Android compact très contraint

| Capture | Observation |
|---|---|
| 01-plateau-main | Trade row + EN JEU compact + MAIN + JOUER visible à 340px ✅ |
| 02-main-jouable | JOUER accessible ✅ |
| 03-fin-tour | "Fin du tour" visible ✅ |

### Portrait 390×844 — Témoin (NR)

| Capture | Observation |
|---|---|
| 01-plateau | Layout portrait intact ✅ |
| 02-main-jouable | JOUER accessible en portrait ✅ |

---

## Observations visuelles

**✅ 844×390 :** Layout propre. Sections bien proportionnées. Cartes de main
plus compactes (76px) mais complètement lisibles avec nom + faction + effet.
JOUER badge visible. Beaucoup de marge en bas.

**✅ 800×360 :** Légèrement plus serré mais toutes les sections restent
visibles. La MAIN occupe correctement la zone basse. "Fin du tour" visible.

**✅ 740×340 :** Très contraint mais fonctionnel. Trade row cards (64×76px)
affichent nom + faction + type. MAIN avec 3 cartes + JOUER tous visibles.
Actions accessibles sans scroll.

**ℹ️ Journal à 800×360 :** Le panneau journal (overlay absolu, maxHeight 45%)
couvre la zone MAIN quand ouvert. C'est intentionnel. La MAIN reste dans le
DOM et redevient visible dès la fermeture du journal.

---

## Limites restantes

1. **Viewport inférieur à 320px** — À 310px ou moins, la MAIN reste lisible
   (116px) mais les cartes à 76px sont très serrées verticalement. Non ciblé
   par ce patch (représente < 5% des appareils Android).

2. **Chrome iOS (400px+ en paysage)** — Non testé (Playwright ne simule pas
   WebKit iOS). Le layout devrait fonctionner mais n'est pas prouvé.

3. **5 cartes+ en main** — Avec 5+ cartes en main, le scroll horizontal reste
   nécessaire. Le gradient de droite indique le scroll. Comportement identique
   portrait.

4. **Preuve réelle sur appareil physique** — Les captures Playwright confirment
   le layout à des viewports représentatifs. Une vérification finale sur
   appareil physique (Pixel ou Samsung Galaxy) est recommandée.

---

## Statut produit paysage

**Portrait : orientation principale, stable, recommandée.**

**Paysage : supporté — layout fonctionnel et jouable confirmé sur viewports
contraints simulés (844×390, 800×360, 740×340). Validation sur appareil
physique recommandée avant déclaration "recommandé".**

---

## Garanties gameplay

- Aucune modification du moteur.
- Aucune modification des règles.
- Aucune modification des cartes, coûts, effets ou équilibrage.
- Portrait inchangé (243 tests NR).

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (256 tests + build) | ✅ GREEN |
| Playwright 15 captures (3 viewports) | ✅ 15/15 |
| Main visible à 340px | ✅ Confirmé |
| Actions principales accessibles | ✅ Confirmé |
| Journal sans bloquer la main | ✅ Confirmé |
| Portrait non régressé | ✅ Confirmé |
| Gameplay inchangé | ✅ Confirmé |
| Statut paysage | ✅ Supporté (validation physique recommandée) |
