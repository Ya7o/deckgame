# PATCH 0047 — Corrections mobile/PWA critiques

**Date :** 2026-06-08
**Commit :** c00af90
**Branche :** master
**Tests unitaires :** 268 / 268 GREEN
**Playwright :** 8 / 8 GREEN

---

## Objectif

Corriger les problèmes P2-01 et P2-03 identifiés dans l'audit PATCH 0046.

---

## Corrections apportées

### P2-01 — Journal portrait : bouton de fermeture explicite ✅

**Problème :** En mode portrait, le journal ne disposait pas de bouton de fermeture visible.
L'utilisateur devait re-cliquer "Journal" pour le fermer, contrairement au mode paysage
qui affiche un bouton ×.

**Correction (GameBoard.tsx) :**
- Ajout d'un header dans la section journal portrait avec :
  - Un `<span>Journal</span>` (label visible, cohérent avec le paysage)
  - Un `<button aria-label="Fermer le journal">×</button>` (ferme au clic)
- `maxHeight={150}` passé explicitement à `<GameLog>` (cohérence avec paysage)
- Padding ajusté : `6px 8px 8px 8px`

**Tests ajoutés (4) :**
- Bouton × présent après ouverture du journal
- Click × ferme le journal (bouton disparaît)
- Header span "Journal" visible
- StartScreen : bouton fullscreen a `alignSelf: center`

**Correction technique tests :** PATCH 0045 B afterEach ne nettoyait pas `vi.stubGlobal`
(`vi.restoreAllMocks()` ne restaure pas les globals). Ajout de `vi.unstubAllGlobals()`
dans afterEach de PATCH 0045 B. Aussi ajouté en défense dans PATCH 0047 A beforeEach/afterEach.

---

### P2-03 — StartScreen : bouton "Plein écran" moins prominent ✅

**Problème :** Le bouton "Plein écran" était stylé comme les boutons de mode de jeu
(pleine largeur, hauteur identique), donnant l'impression d'une option obligatoire.

**Correction (App.tsx) :**

Portrait :
- `fontSize: "13px" → "11px"`, `opacity: 0.7 → 0.6`
- Ajout : `alignSelf: "center"`, `padding: "4px 14px"`, `marginTop: "-4px"`
- Résultat : bouton centré, plus petit, visuellement séparé des boutons jeu

Paysage :
- `fontSize: "12px" → "11px"`, `opacity: 0.7 → 0.6`
- Ajout : `alignSelf: "center"`, `padding: "3px 12px"`, `marginTop: "-2px"`

---

## Tests unitaires (268 / 268)

| Suite | Tests | Résultat |
|---|---|---|
| Suites PATCH 0001–0045 | 264 | ✅ GREEN |
| PATCH 0047 A — Journal portrait close button | 3 | ✅ GREEN |
| PATCH 0047 B — StartScreen fullscreen style | 1 | ✅ GREEN |
| **Total** | **268** | **✅ GREEN** |

---

## Playwright 8 / 8

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Journal fermé par défaut | 390×844 | ✅ |
| A2 — Click Journal ouvre avec bouton × | 390×844 | ✅ |
| A3 — Click × ferme le journal | 390×844 | ✅ |
| A4 — Header "Journal" visible dans section log | 390×844 | ✅ |
| B1 — Fullscreen button plus étroit que boutons jeu | 390×844 | ✅ |
| B2 — Fullscreen button landscape compact | 844×390 | ✅ |
| C1 — Landscape journal overlay intact | 844×390 | ✅ |
| C2 — Portrait MAIN + Fin du tour intacts | 390×844 | ✅ |

Captures : `reports/patch-0047/screenshots/`

---

## Problèmes restants de PATCH 0046

| ID | Description | Statut |
|---|---|---|
| P2-01 | Journal portrait : pas de bouton fermeture | ✅ **Corrigé** |
| P2-02 | Rangée commerciale scroll | ℹ️ Déjà résolu (gradient présent) |
| P2-03 | Fullscreen button trop prominent | ✅ **Corrigé** |
| P2-04 | PWA manifest : icônes PNG absentes | ⏳ À traiter (PATCH 0048+) |
| P2-05 | Modal carte : accès non évident | ⏳ À traiter (PATCH 0048+) |
| P3-01 | Tour bot : transition invisible | ⏳ À traiter |
| P3-02 | Manifest screenshots vide | ⏳ À traiter |
| P3-03 | Espace vide portrait accueil | ⏳ À traiter |
| P3-04 | Incohérence style Plein écran | ✅ **Corrigé** (P2-03) |

---

## Sécurité gameplay

- Aucune modification moteur / règles / cartes ✅
- Aucune modification logique de jeu ✅
- Seuls GameBoard.tsx (UI journal) et App.tsx (style bouton) modifiés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Portrait journal : header + close button |
| `deckgame/src/App.tsx` | StartScreen fullscreen button style réduit |
| `deckgame/src/tests/gameboard.test.tsx` | +4 tests PATCH 0047, fix afterEach PATCH 0045 B |
| `deckgame/e2e/patch-0047.spec.ts` | Nouveau — 8 tests Playwright |
| `reports/patch-0047/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (268 tests + build) | ✅ GREEN |
| Playwright 8 tests | ✅ 8/8 |
| Problèmes P0 | ✅ Aucun |
| Problèmes P1 | ✅ Aucun |
| Corrections P2 apportées | ✅ P2-01 + P2-03 |
| Gameplay modifié | ✅ Non |
