# PATCH 0043 — Stabiliser le mode paysage post-audit

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests :** 243 / 243 GREEN
**Playwright :** 6 / 6 captures OK

---

## Objectif

Corriger les issues P1/P2 identifiées dans l'audit PATCH 0042 et activer
le mode paysage en version stable.

---

## Corrections apportées

### 1. `App.tsx` — StartScreen landscape 2 colonnes (fix P1)

**Issue :** En paysage 844×390, la description des règles ("Chaque joueur
commence avec…") était tronquée hors viewport.

**Fix :** Ajout d'une branche `if (orientation === "landscape")` dans
`StartScreen` qui produit un layout 2 colonnes :
- **Colonne gauche** (280 px fixe) : titre DECKGAME + champs Joueur 1 / Joueur 2
  + boutons "2 Joueurs" et "Contre le Bot"
- **Colonne droite** (flex 1) : sous-titre + lignes de règles

**Résultat :** Tous les éléments de l'écran d'accueil sont visibles
simultanément en paysage, sans scroll.

---

## Issues non retenues (P2/P3 — acceptées telles quelles)

| ID | Description | Décision |
|---|---|---|
| L-P2-01 | Noms de cartes longs serrés en 68 px | ✅ Accepté : 3-line clamp lisible |
| L-P2-02 | Micro-cartes EN JEU (48×54 px) | ✅ Accepté : lisible jusqu'à 5 cartes |
| L-P2-03 | Game-over log vide sur partie très courte | ✅ Non bloquant |
| L-P3-01 | Explorateurs "×16" rangée commerciale | ✅ Identique portrait |
| L-P3-02 | Double bouton Fermer (✕ + texte) modal | ✅ Conservé pour accessibilité |

---

## Tests (gameboard.test.tsx)

7 tests ajoutés répartis en 2 suites PATCH 0043 :

| Suite | Tests |
|---|---|
| A. StartScreen paysage (layout 2 colonnes) | layout flex row · titre visible · règles visibles · bouton Solo · clic lance plateau paysage |
| B. StartScreen portrait non régressé | layout colonne · clic lance plateau portrait |

---

## Captures Playwright (`e2e/patch-0043.spec.ts`)

6 captures `reports/patch-0043/screenshots/` :

| Capture | Observations |
|---|---|
| portrait/01-accueil | Portrait inchangé — centré, toutes sections visibles ✅ |
| portrait/02-plateau | Plateau portrait stable ✅ |
| landscape/01-accueil | **2 colonnes** : form gauche, règles droite — P1 résolu ✅ |
| landscape/02-accueil-buttons | Boutons "2 Joueurs" et "Contre le Bot" visibles ✅ |
| landscape/03-plateau | Plateau paysage post-accueil fonctionnel ✅ |
| landscape/04-accueil-2cols | Description complète visible sans scroll ✅ |

---

## Bilan de la séquence PATCH 0039–0043

| Patch | Objet | Statut |
|---|---|---|
| 0039 | Architecture responsive (hook, data-layout, CSS vars) | ✅ |
| 0040 | Layout plateau paysage 844×390 | ✅ |
| 0041 | Interactions, modales, journal, game-over paysage | ✅ |
| 0042 | QA comparative + décision activation | ✅ OUI |
| 0043 | Stabilisation post-audit | ✅ |

**Mode paysage : ACTIVÉ — stable, testé, prêt en production.**

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (243 tests + build) | ✅ GREEN |
| Playwright 6 captures | ✅ 6/6 |
| Issue P1 résolue | ✅ Accueil landscape 2 colonnes |
| Non-régression portrait | ✅ Confirmé (243 tests, captures) |
| Mode paysage activé | ✅ |
