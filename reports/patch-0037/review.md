# PATCH 0037 — Audit comparatif portrait vs paysage

**Commit :** `50e5718`
**Date :** 2026-06-08
**Branche :** master
**Type :** QA / audit / documentation
**Statut :** GREEN — 197/197 tests · build propre · 22/22 captures Playwright

---

## Objectif

Comparer les orientations portrait (390×844) et paysage (844×390) par capture Playwright
sur les 11 états de jeu clés, analyser les forces et faiblesses de chaque orientation,
et formuler une recommandation entre :

- **Option A** : Portrait reste l'orientation principale
- **Option B** : Paysage devient l'orientation recommandée
- **Option C** : Double layout adaptatif

**Aucune correction UI ni gameplay n'a été appliquée dans ce patch.**

---

## Tâche préalable : correction hash PATCH 0036

Le hash du commit PATCH 0036 (`1ca0760`) a été renseigné dans
`reports/patch-0036/review.md` (était "à renseigner après push").

---

## Spec Playwright

Fichier : `deckgame/e2e/compare-orientations.spec.ts`

```bash
cd ~/apps/deck/deckgame
npx playwright test e2e/compare-orientations.spec.ts --reporter=list
```

- **22/22 tests passés** en 18,1 s
- Portrait `test.use({ viewport: { width: 390, height: 844 } })`
- Landscape `test.use({ viewport: { width: 844, height: 390 } })`
- Captures dans : `reports/patch-0037/screenshots/{portrait,landscape}/`

---

## Captures générées

### Portrait (390×844)

| Fichier | État |
|---|---|
| `portrait/01-accueil.png` | Écran d'accueil |
| `portrait/02-debut-partie.png` | Début de partie |
| `portrait/03-main-jouable.png` | Main avec boutons JOUER |
| `portrait/04-detail-carte-main.png` | Modale détail carte |
| `portrait/05-detail-carte-trade.png` | Modale carte rangée commerciale |
| `portrait/06-trade-row.png` | Rangée commerciale |
| `portrait/07-achat-visible.png` | Boutons ACHAT disponibles |
| `portrait/08-journal-ouvert.png` | Journal de partie |
| `portrait/09-pret-fin-tour.png` | Prêt pour fin de tour |
| `portrait/10-tour-bot.png` | Tour du Bot |
| `portrait/11-game-over.png` | Fin de partie |

### Landscape (844×390)

Identique — 11 captures dans `landscape/`.

---

## Synthèse comparative

| Section | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Barre Bot | ✅ Lisible | ✅ Identique |
| Rangée commerciale | ⚠️ Noms tronqués, 4,5 cartes visibles | ✅ **6 cartes, noms complets** |
| EN JEU | ✅ Fonctionnel | ✅ Fonctionnel |
| Ressources + actions | ✅ Boutons visibles | ✅ Identique |
| **MAIN — zone de jeu** | ✅ **Cartes et JOUER visibles** | ❌ **Hors écran — bloquant** |
| Journal | ⚠️ Partiellement hors écran | ❌ Totalement hors viewport |
| Espace vide global | ⚠️ ~55% vide en bas | Compact (mais MAIN absent) |

**Constat clé** : En paysage à 390px de hauteur, les 5 sections empilées ne tiennent pas.
La MAIN sort du viewport — le joueur ne peut ni voir ses cartes ni appuyer sur JOUER
sans un scroll vertical non naturel sur mobile.

Détail complet : `docs/layout-orientation-audit.md`

---

## Recommandation : Option A — Portrait reste l'orientation principale

**Raisons :**

1. **Bloquant landscape** : La MAIN (zone d'interaction principale — 1 à 6 JOUER par tour)
   est hors écran en 844×390. Corriger cela nécessiterait une refonte architecturale du
   layout (2 colonnes ou sections fixes), estimée à 3–5 patchs.

2. **Problème portrait corrigeable** : La troncature des noms de cartes (P2-3, audit 0036)
   est adressable par un ajustement CSS ciblé (police 9px ou wrap 2 lignes) sans refonte.

3. **Cible produit** : L'app est conçue pour mobile en usage portrait (téléphone tenu
   verticalement). Le viewport 390×844 correspond aux iPhone 14/15 Pro standard.

4. **Complexité option C** : Un double layout adaptatif (orientation: landscape) représente
   × 2 de surface à maintenir et n'est pas justifié pour une app à ce stade.

---

## Impact sur les patchs suivants

Ce patch valide et précise le plan défini dans le PATCH 0036 :

| Patch | Contenu |
|---|---|
| **PATCH 0038** | Noms cartes (2 lignes / 9px), compteur main, overlay bot renforcé, bouton Attaquer, fermer modale 44px |
| **PATCH 0039** | Journal flottant, signal changement de tour |
| **PATCH 0040** | Identité visuelle accueil |

Le PATCH 0037 lui-même ne modifie pas le code — il est un **audit pur** comme le 0036.

---

## Confirmation

- ✅ Aucune correction UI appliquée dans ce patch
- ✅ Aucune modification gameplay
- ✅ Aucune modification moteur, cartes, équilibrage
- ✅ 197/197 tests GREEN
- ✅ Build propre (tsc + vite)
- ✅ 22/22 captures Playwright dans `reports/patch-0037/screenshots/{portrait,landscape}/`
- ✅ Spec `deckgame/e2e/compare-orientations.spec.ts` créée et commitée
- ✅ Hash PATCH 0036 corrigé (`1ca0760`)
- ✅ Recommandation : Option A (portrait principal)
