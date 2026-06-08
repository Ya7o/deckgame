# PATCH 0046 — Audit réel mobile post-PWA

**Date :** 2026-06-08
**Commit :** `3d20b31`
**Branche :** master
**Tests :** 264 / 264 GREEN (inchangé — aucune modification source)
**Playwright audit :** 25 / 25

---

## Préconditions vérifiées

- PATCH 0045 intégré : `useFullscreen.ts`, `manifest.webmanifest`, metas PWA, `height: 100dvh`
- `npm run check` : 264 / 264 GREEN
- Aucune correction UI/gameplay dans ce patch

---

## Viewports testés

| ID | Viewport | Orientation | Cible réelle |
|---|---|---|---|
| B | 390×844 | Portrait | iPhone SE / standard |
| C | 844×390 | Paysage | Référence landscape |
| D | 800×360 | Paysage contraint | Android moyen |
| E | 740×340 | Paysage très contraint | Android compact |

Toutes captures : `reports/patch-0046/screenshots/`

---

## Résultats PWA / manifest (Section A)

| Vérification | Statut | Note |
|---|---|---|
| `manifest.webmanifest` HTTP 200 | ✅ OK | `display: standalone`, `orientation: any` |
| `<link rel="manifest">` dans index.html | ✅ OK | |
| `viewport-fit=cover` | ✅ OK | `env(safe-area-inset-bottom)` utilisé dans GameBoard |
| `apple-mobile-web-app-capable` | ✅ OK | |
| `theme-color: #0e0e12` | ✅ OK | |
| `favicon.svg` accessible | ✅ OK | Accessible via `/deckgame/favicon.svg` |
| Bouton "Plein écran" visible (Chromium) | ✅ OK | `document.fullscreenEnabled = true` en Chromium |
| Icônes PNG 192×192 / 512×512 | ⚠️ Absent | SVG uniquement — qualité variable selon navigateur |
| `screenshots` dans manifest | ⚠️ Tableau vide | Pas de promotion install sur Chrome/Edge |

**Conclusion PWA :** Support de base fonctionnel. Manifest valide. Plein écran détecté et bouton visible. Icônes PNG manquantes — peut affecter la qualité d'icône lors de l'installation en PWA.

---

## Résultats par viewport

### Portrait 390×844

| Vérification | Statut |
|---|---|
| Accueil visible, boutons accessibles | ✅ |
| `data-layout="portrait"` présent | ✅ |
| Section MAIN visible | ✅ |
| Boutons JOUER présents | ✅ |
| Journal accessible (toggle via bouton) | ✅ |
| Fin du tour accessible | ✅ |
| Fin du tour **désactivé** pendant tour bot | ✅ confirmé (vérifié à t+200ms) |
| RANGÉE COMMERCIALE présente | ✅ |
| Bouton "Plein écran" visible | ✅ |
| Main bot non exposée | ✅ |

**Problèmes portrait observés :** voir classification ci-dessous.

### Paysage 844×390

| Vérification | Statut |
|---|---|
| `data-layout="landscape"` présent | ✅ |
| MAIN visible + JOUER accessibles | ✅ |
| Fin du tour accessible | ✅ |
| Journal overlay avec bouton × fermeture | ✅ |
| Fin du tour désactivé pendant tour bot | ✅ |
| Bouton "Plein écran" visible | ✅ |

Hauteur MAIN à 844×390 : **~196px** (espace confortable pour cartes 76px).

### Paysage contraint 800×360

| Vérification | Statut |
|---|---|
| MAIN visible | ✅ |
| JOUER accessibles | ✅ |
| Fin du tour accessible | ✅ |
| Journal overlay fonctionnel | ✅ |

### Paysage très contraint 740×340

| Vérification | Statut |
|---|---|
| MAIN visible | ✅ |
| JOUER accessibles | ✅ |
| Fin du tour accessible | ✅ |
| Hauteur MAIN mesurée | **160.8px** (cartes 76px : OK) |

---

## Classification des problèmes

### P0 — Empêche de jouer

Aucun problème P0 identifié. L'application est jouable sur tous les viewports testés.

---

### P1 — Gêne forte

**P1-01 — Journal portrait : inline sans maxHeight, déborde en fin de partie**

En portrait, le journal s'affiche en bas du layout principal (inline, `flexShrink: 0`).
Sans `maxHeight` et avec `overflow: hidden` sur le root, les entrées log
en fin de partie longue (20+ entrées) dépasseront le viewport et seront
silencieusement coupées — l'utilisateur ne peut pas scroller pour les voir.

Comparaison : en paysage, le journal est un overlay avec `maxHeight: 120px`.

**Correction requise dans PATCH 0047.**

---

### P2 — Friction visible

**P2-01 — Journal portrait : pas de bouton de fermeture explicite**

En portrait, fermer le journal nécessite de re-cliquer "Journal". En paysage, un
bouton × est visible. Cette inconsistance peut dérouter l'utilisateur.

**P2-02 — Rangée commerciale : dernière carte tronquée sans indicateur scroll**

La 5e ou 6e carte de la rangée commerciale est partiellement visible, sans
gradient ou indicateur de scroll horizontal. Sur le vrai mobile avec touch, le
scroll fonctionne, mais il n'est pas évident depuis une capture statique.

**P2-03 — Bouton "Plein écran" sur StartScreen : style trop prominent**

Sur l'écran d'accueil portrait, le bouton "Plein écran" est stylé identiquement
aux boutons "2 Joueurs" et "Contre le Bot" (pleine largeur, même hauteur).
Il ressemble à une option de mode de jeu obligatoire plutôt qu'une option
optionnelle de confort.

**P2-04 — Manifest PWA : icônes PNG absentes**

Le manifest ne référence que `favicon.svg`. Certains navigateurs/OS (Android
Chrome ≤ 12, Samsung Internet) affichent une icône basse qualité ou
générique lors de l'installation PWA. Les recommandations Chrome exigent
des PNG 192×192 et 512×512 pour le badge d'installation.

**P2-05 — Modal carte : accès non évident**

Cliquer "JOUER" joue la carte immédiatement. La modal de détail de carte s'ouvre
uniquement en tapant sur le corps de la carte (hors zone JOUER). Cette distinction
n'est pas indiquée visuellement et peut amener des joueurs à jouer
involontairement des cartes en cherchant à les inspecter.

---

### P3 — Polish

**P3-01 — Tour bot : transition invisible**

Le bot joue après 600ms de délai. Pendant ce délai, aucun indicateur visuel
("Tour du Bot...", spinner, bannière) n'informe le joueur que le bot calcule.
La transition semble instantanée. Acceptable mais amélioration possible.

**P3-02 — Manifest `screenshots` vide**

`"screenshots": []` dans le manifest désactive la promotion d'installation sur
Chrome/Edge Android. Ajouter au moins une capture améliorerait l'install prompt.

**P3-03 — Espace vide en portrait (accueil)**

L'écran d'accueil portrait n'utilise que ~50% de la hauteur sur un iPhone SE
(390×844). La partie basse est un grand espace noir vide.

**P3-04 — Incohérence style "Plein écran" in-game vs accueil**

En jeu : "Plein écran" est un micro-bouton compact (opacité 70%).
À l'accueil : "Plein écran" est un bouton plein largeur (même style que les modes de jeu).
Incohérence visuelle mineure.

---

## Récapitulatif

| Priorité | Nb | Items |
|---|---|---|
| P0 | 0 | — |
| P1 | 1 | Journal portrait overflow |
| P2 | 5 | Journal close, trade row scroll, fullscreen style, icons PWA, modal access |
| P3 | 4 | Bot indicator, screenshots manifest, empty space, style coherence |

---

## Statut produit

**Portrait 390×844 :** Utilisable. Problème P1 journal identifié (fin de partie).
Recommandé pour l'usage quotidien.

**Paysage (844×390, 800×360, 740×340) :** Supporté. Layout fonctionnel
sur tous les viewports testés. Actions accessibles, MAIN visible.
Validation sur appareil physique recommandée.

**PWA installable :** Manifest valide, display standalone configuré.
Icônes PNG manquantes — install quality partielle.

**Plein écran :** Bouton fonctionnel en Chromium. iOS Safari : disponible en
standalone uniquement (webkitRequestFullscreen, API limitée).

---

## Sécurité gameplay

- Main bot non exposée pendant son tour ✅
- Actions humaines bloquées pendant tour bot ✅ (Fin du tour disabled)
- Aucune modification moteur / règles / cartes dans ce patch ✅

---

## Fichiers de ce patch

| Fichier | Statut |
|---|---|
| `deckgame/e2e/patch-0046.spec.ts` | Nouveau — 25 tests audit |
| `reports/patch-0046/review.md` | Nouveau — ce rapport |
| `reports/patch-0046/screenshots/*.png` | 22 captures (B×8, C×5, D×3, E×3, F×2, A×1) |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (264 tests + build) | ✅ GREEN |
| Playwright 25 tests audit | ✅ 25/25 |
| Problèmes P0 | ✅ Aucun |
| Problèmes P1 | ⚠️ 1 (journal portrait overflow) |
| Problèmes P2 | ⚠️ 5 (voir liste) |
| Problèmes P3 | ℹ️ 4 (polish) |
| Corrections apportées | ✅ Aucune (audit seulement) |
| Gameplay modifié | ✅ Non |
