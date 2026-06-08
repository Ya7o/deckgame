# PATCH 0038 — Corriger les frictions portrait prioritaires

**Commit :** `2bd4bc5`
**Date :** 2026-06-08
**Branche :** master
**Type :** code / QA / doc
**Statut :** GREEN — 208/208 tests · build propre · 9/9 captures Playwright

---

## Orientation : portrait reste la cible

Ce patch corrige exclusivement les frictions en mode portrait 390×844.
Le mode paysage (844×390) n'a pas été implémenté — la refonte de layout
plateau nécessaire est hors périmètre.

---

## Frictions corrigées

### 1. Noms de cartes sur cartes compactes — `CardView.tsx`

**Problème (P2-2, audit 0036)** : Noms longs ("Yacht de l'Ambassade",
"Robot Ravitailleur") se cassaient de façon arbitraire dans la largeur de
80px (`wordBreak: "break-word"` seul insuffisant à 10px).

**Correction :**
- `fontSize: "10px"` → `fontSize: "9px"` (gain 10% de place horizontale)
- `lineHeight: 1.2` → `lineHeight: 1.1`
- Ajout `display: "-webkit-box"`, `WebkitLineClamp: 3`, `overflow: "hidden"`
- Conservation de `wordBreak: "break-word"` + ajout `overflowWrap: "break-word"`

**Résultat** : les noms s'affichent proprement sur 1–3 lignes max, sans
dépasser la carte ni couper les effets.

---

### 2. Indicateur de cartes en main — `GameBoard.tsx`

**Problème (P2-1, audit 0036)** : Pas d'indication du nombre total de
cartes en main. Le joueur pouvait ignorer les cartes hors écran.

**Correction :**
- Ajout d'un compteur `· N carte(s)` dans le header de la section MAIN,
  visible dès qu'il y a au moins 1 carte.
- Gradient fade droit élargi de 28px → 36px.

**Résultat** : "MAIN — Joueur 1 (Tour 1) · 5 cartes" visible dès l'entrée
dans la section. Le joueur sait combien de cartes il possède.

---

### 3. Tour bot — signal visuel renforcé — `GameBoard.tsx`

**Problème (P2-3, audit 0036)** : Le bandeau "Le Bot réfléchit…" était
petit (12px, padding 7px). L'overlay sur la MAIN était
`rgba(0,0,0,0.45)` — quasi invisible sur fond sombre.

**Corrections :**
- Bandeau : `font-size` 12px → 13px, `padding` 7px → 10px, ajout icône ⏳
- Overlay MAIN : `rgba(0,0,0,0.45)` → `rgba(0,0,0,0.60)` + libellé
  "Tour du Bot" centré + `filter: grayscale(40%) opacity(0.7)` sur
  le conteneur de cartes
- Gradient fade masqué pendant le tour bot (sans objet)

**Résultat** : l'état "bot joue" est immédiatement perceptible :
bandeau proéminent en haut, cartes désaturées et semi-transparentes,
libellé "Tour du Bot" au centre de la zone main.

---

### 4. Bouton Attaquer — zone tactile — `GameBoard.tsx`

**Problème (P2-5, audit 0036)** : `minHeight: "34px"` en dessous des
44px recommandés pour cibles tactiles mobiles.

**Correction :**
- `minHeight: "34px"` → `minHeight: "44px"` sur le bouton ⚔ Attaquer.

**Résultat** : cible tactile conforme. Comportement et visibilité
inchangés.

---

### 5. Bouton Fermer de modale — zone tactile 44×44px — `CardDetailModal.tsx`

**Problème (P3-3, audit 0036)** : Bouton ✕ avec `padding: "6px 10px"`
produisait une cible ~30×40px, sous les 44×44px recommandés.

**Correction :**
- `minWidth: "44px"`, `minHeight: "44px"`, `padding: "0"`, `fontSize: "18px"`
- Layout `display: flex, alignItems: center, justifyContent: center`

**Résultat** : zone tactile de 44×44px, bouton centré, visible en
haut-droite de la modale.

---

### 6. Fondu rangée commerciale — `GameBoard.tsx`

**Problème (P3-6, audit 0036)** : Gradient de 28px vers `#12121a` peu
perceptible sur fond sombre.

**Correction :**
- Largeur du gradient : 28px → 40px

**Résultat** : zone de fondu plus large, signal de scroll plus visible.

---

## Ce qui n'a pas été corrigé dans ce patch

| Problème | Raison du report |
|---|---|
| Espace vide accueil / game-over (P1-1, P1-2) | Prévu PATCH 0037 mais scope étendu au PATCH 0038 était déjà large ; reporté PATCH 0039 |
| EN JEU vide opacity 0.4 (P3-2) | Idem |
| Hiérarchie boutons accueil (P3-7) | Idem |
| Journal flottant (P2-4) | PATCH 0039 |
| Signal changement de tour (P3-4) | PATCH 0039 |
| Identité visuelle accueil (P3-1) | PATCH 0040 |

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `deckgame/src/ui/CardView.tsx` | Nom carte : 9px, lineClamp 3, overflowWrap |
| `deckgame/src/ui/GameBoard.tsx` | Bandeau bot, gradient trade row 40px, compteur main, gradient MAIN 36px, overlay bot renforcé, bouton Attaquer 44px |
| `deckgame/src/ui/CardDetailModal.tsx` | Bouton ✕ 44×44px |
| `deckgame/src/tests/gameboard.test.tsx` | 11 tests PATCH 0038 ajoutés |
| `deckgame/e2e/audit-0038.spec.ts` | Spec Playwright portrait 9 captures |
| `reports/patch-0038/screenshots/` | 9 captures générées |

---

## Tests

### Tests jsdom (Vitest) — 208/208 GREEN

11 nouveaux tests couvrant :
- A. Noms cartes : `[title]` non vide, style `overflow: hidden` présent
- B. Compteur main : `N carte(s)` visible / absent si main vide
- C. Tour bot : bandeau ⏳, label "Tour du Bot", overlay position abs, JOUER absent
- D. Bouton Attaquer : `minHeight: "44px"` confirmé
- E. Bouton Fermer : `minWidth: "44px"`, `minHeight: "44px"`, bouton Fermer texte présent

### Playwright portrait 390×844 — 9/9 GREEN (8,4s)

| Capture | État |
|---|---|
| `01-accueil.png` | Écran d'accueil |
| `02-main-5-cartes.png` | Main avec 3 cartes + compteur |
| `03-trade-row-noms.png` | Rangée commerciale noms cartes |
| `04-achat-en-jeu.png` | Cartes jouées + boutons ACHAT |
| `05-tour-bot.png` | Tour bot — bandeau ⏳, overlay "Tour du Bot", cartes désaturées |
| `06-modale-ouverte.png` | Modale ouverte — bouton ✕ 44px visible |
| `07-journal-ouvert.png` | Journal ouvert |
| `08-pret-fin-tour.png` | Prêt fin de tour |
| `09-game-over.png` | Écran fin de partie |

---

## Confirmation

- ✅ Portrait reste l'orientation principale
- ✅ Paysage non implémenté
- ✅ Aucune correction gameplay
- ✅ Aucune modification moteur, règles, cartes, coûts, effets, équilibrage
- ✅ Aucune nouvelle mécanique ajoutée
- ✅ 208/208 tests GREEN (197 préexistants + 11 nouveaux)
- ✅ Build propre (tsc + vite)
- ✅ 9/9 captures Playwright dans `reports/patch-0038/screenshots/`
