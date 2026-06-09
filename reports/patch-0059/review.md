# PATCH 0059 — Résumé bot détaillable, non tronqué silencieusement

**Date :** 2026-06-09
**Commit :** 5d605c7
**Branche :** master
**Tests unitaires :** 316 / 316 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Résoudre le problème P1-2 identifié lors de l'audit PATCH 0057 : la barre de résumé bot
(`✦ Bot joue…`) tronquait silencieusement si le bot avait joué de nombreuses cartes —
pas de compteur "+N actions", pas d'accès direct au journal.

---

## Modifications apportées

### `deckgame/src/i18n/fr.ts`

```ts
botSummaryLink: "Voir journal",
```

### `deckgame/src/ui/GameBoard.tsx` — landscape et portrait

**Avant :** barre `whiteSpace: nowrap` + `textOverflow: ellipsis` → truncation silencieuse.

**Après :** barre `flexWrap: wrap` avec affichage limité :

| Layout | Actions affichées | Si dépassement |
|---|---|---|
| Landscape | 3 premières | +N actions · bouton "Voir journal" |
| Portrait | 4 premières | +N actions · bouton "Voir journal" |

Le bouton "Voir journal" appelle `setShowLog(true)` — ouvre le panneau journal existant.

Le bot ne révèle jamais sa main (le filtre `state.log` exclut déjà les entrées privées).

---

## Tests unitaires ajoutés (6 — total 316)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0059 A | Landscape : résumé absent au tour 1 | ✅ |
| PATCH 0059 A | Landscape : ≤3 actions, pas de Voir journal | ✅ |
| PATCH 0059 A | Landscape : >3 actions → +N et Voir journal | ✅ |
| PATCH 0059 A | Landscape : clic Voir journal ouvre le journal | ✅ |
| PATCH 0059 B | Portrait : ≤4 actions, pas de Voir journal | ✅ |
| PATCH 0059 B | Portrait : >4 actions → Voir journal visible | ✅ |

---

## Corrections annexes incluses dans ce patch

Les 5 tests PATCH 0038–0039 avaient une déclaration `text` commentée par erreur
dans une session précédente (`// const text = container.textContent ?? ""; // unused`),
causant une référence non définie au runtime. La déclaration a été restaurée.
Total tests : 310 → 316 (+6 PATCH 0059).

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Paysage : premier tour, pas de résumé bot | 844×390 | ✅ |
| A2 — Paysage : après tour bot, ✦ présent | 844×390 | ✅ |
| A3 — Paysage : résumé non tronqué (overflow visible) | 844×390 | ✅ |
| B1 — Portrait : après tour bot, résumé visible | 390×844 | ✅ |
| B2 — Portrait : layout intact après résumé bot | 390×844 | ✅ |

---

## Sécurité gameplay

- Moteur de règles inchangé ✅
- Aucune information sur la main du bot divulguée ✅
- Portrait non régressé ✅

---

## Problèmes P1 après PATCH 0059

| # | Description | Statut |
|---|---|---|
| P1-1 | Bouton Activer direct en landscape | ✅ RÉSOLU (PATCH 0058) |
| P1-2 | Résumé bot tronqué silencieusement | ✅ RÉSOLU (ce patch) |

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/i18n/fr.ts` | botSummaryLink |
| `deckgame/src/ui/GameBoard.tsx` | Résumé bot landscape + portrait : flex + limite + lien |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0059 + correction text var (total 316) |
| `deckgame/e2e/patch-0059.spec.ts` | Nouveau — 5 tests Playwright |
| `reports/patch-0059/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (316 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| P1-2 résolu | ✅ |
| Portrait non régressé | ✅ |
| Gameplay modifié | ✅ Non |
