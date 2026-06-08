# PATCH 0040 — Créer le layout plateau paysage

**Commit :** `8463565`
**Date :** 2026-06-08
**Branche :** master
**Type :** code / QA / doc
**Statut :** GREEN — 225/225 tests · build propre · 10/10 captures Playwright

---

## Orientation

Portrait conservé, non régressé.
Layout paysage activé automatiquement via `useOrientation()` quand le viewport est paysage.

---

## Structure du layout plateau paysage

Viewport cible : 844×390 px

```
┌──────────────────────────────────────────────────────────┐  ~30px (si tour bot)
│ ⏳ Le Bot réfléchit…                                     │
├──────────────────────────────────────────────────────────┤  ~40px
│ Bot ♥50  Pioche 5 · Défausse 0 · Main 5  [🛡 avant-p.] │
├──────────────────────────────────────────────────────────┤  ~120px
│ RANGÉE COMMERCIALE  (6 cartes + explorateurs)            │
│ [Redoute][Roue Blob][Robot Rav.][Corvette][Station][2×] │
├───────────────────────────────────┬──────────────────────┤  ~55px
│ EN JEU (micro-cartes 48×54px)     │ ♥50  Commerce:0 ⚔0  │
│ Aucune carte en jeu.              │ [Journal][Fin du tour]│
│                                   │ [Abandonner]          │
├──────────────────────────────────────────────────────────┤  ~120px
│ MAIN — Joueur 1 (Tour 1) · 5 cartes                      │
│ [Éclaireur][Éclaireur][Éclaireur][Éclaireur][Vipère]    │
│ [JOUER]    [JOUER]    [JOUER]    [JOUER]    [JOUER]     │
└──────────────────────────────────────────────────────────┘
```

**Sans bannière bot :** ~335px utilisés sur 390px disponibles.
**Avec bannière bot :** ~365px. Les deux tiennent dans 390px ✅

---

## Zones visibles sans scroll

| Zone | Portrait | Paysage |
|---|---|---|
| Rangée commerciale complète | ⚠️ 4,5 cartes | ✅ 6 cartes + explorateurs |
| MAIN complète (5 cartes + JOUER) | ✅ | ✅ |
| Ressources + actions | ✅ | ✅ |
| Bot zone | ✅ | ✅ |
| EN JEU | ✅ | ✅ (micro-cartes 48×54px) |

---

## Zones scrollables

| Zone | Comportement |
|---|---|
| Rangée commerciale | `overflowX: "auto"` — scroll horizontal si >6 cartes |
| MAIN | `overflowX: "auto"` — scroll horizontal si >8 cartes (rare) |
| EN JEU | `overflowX: "auto"` — scroll horizontal si >5 cartes en jeu |
| Journal | Overlay absolu bas d'écran, `maxHeight: 45%`, scroll interne |
| Bases adverses | `overflowX: "auto"` dans la zone bot |

---

## Tailles des cartes en paysage

| Zone | card-w | card-h | Raison |
|---|---|---|---|
| Trade row | 68px | 90px | CSS var override `[data-layout="landscape"]` |
| MAIN | 68px | 90px | CSS var override |
| EN JEU | 48px | 54px | Local override `style={{ "--card-w": "48px" }}` |
| Bases adverses | 52px | 40px | Local override compact |

---

## Limites identifiées

| # | Problème | Priorité | Patch |
|---|---|---|---|
| L-01 | Noms de cartes (68px) : "Yacht de l'Ambassade" → "Yacht de l'Ambassad e" — même pattern qu'en portrait mais plus sévère à 68px | P2 | PATCH 0043 |
| L-02 | Bouton "Activer" pour bases en EN JEU non visible en paysage (overflow clip à 54px) — l'utilisateur doit taper la carte pour la modale | P2 | PATCH 0043 |
| L-03 | GameOver screen garde le layout portrait même en paysage | P3 | PATCH 0043 |
| L-04 | Journal overlay en paysage masque la MAIN (maxHeight 45% = 175px sur la zone de 390px) | P2 | PATCH 0041 |

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Layout landscape JSX injecté avant le return portrait (si orientation=landscape) |
| `deckgame/src/tests/gameboard.test.tsx` | 9 tests landscape ajoutés (mock matchMedia) |
| `deckgame/e2e/landscape-0040.spec.ts` | Spec Playwright 10 captures paysage |
| `reports/patch-0040/screenshots/` | 10 captures paysage générées |

---

## Tests — 225/225 GREEN

9 nouveaux tests landscape (mock `window.matchMedia`):
- data-layout=landscape quand matchMedia retourne landscape
- RANGÉE COMMERCIALE présente
- section MAIN présente
- boutons JOUER présents (tour humain)
- Fin du tour présent
- EN JEU présent
- aucune action humaine pendant tour bot
- "Tour du Bot" label présent
- portrait non régressé (portrait par défaut en jsdom)

---

## Captures Playwright paysage 844×390 — 10/10 GREEN (8,5s)

| Capture | Observation |
|---|---|
| `01-accueil.png` | Start screen (portrait layout, non encore adapté paysage) |
| `02-debut-partie.png` | Layout plateau : bot · trade row · EN JEU+ressources · main |
| `03-main-jouable.png` | ✅ 5 cartes main + JOUER · 6 cartes trade row visibles |
| `04-trade-row.png` | Trade row 6 cartes sans scroll |
| `05-achat-visible.png` | Boutons ACHAT visibles sur cartes abordables |
| `06-modale-carte.png` | Modale pleine hauteur visible en paysage |
| `07-tour-bot.png` | ✅ Banner ⏳ · "Tour du Bot" overlay · 5 cartes main visible |
| `08-journal-ouvert.png` | Journal overlay absolu bas d'écran |
| `09-pret-fin-tour.png` | Fin du tour accessible |
| `10-game-over.png` | GameOver (portrait layout, non adapté paysage — L-03) |

---

## Confirmation

- ✅ Portrait conservé et non régressé
- ✅ Paysage actif et jouable sur viewport 844×390
- ✅ MAIN toujours visible et accessible en paysage (problème P0 de PATCH 0037 résolu)
- ✅ Trade row complète visible sans scroll
- ✅ Aucune modification gameplay
- ✅ Aucune modification moteur, règles, cartes, coûts, effets, équilibrage
- ✅ 225/225 tests GREEN
- ✅ Build propre (tsc + vite)
- ✅ 10/10 captures Playwright paysage
