# PATCH 0033 — QA visuelle mobile post-V0 ciblée

## Objectif

Ajouter une preuve QA ciblée sur les corrections UX de PATCH 0032 pour éviter
que les problèmes observés en partie réelle ne réapparaissent.

---

## 1. Scénarios couverts

7 nouveaux tests jsdom dans `src/tests/gameboard.test.tsx` :

| # | Scénario | Assertion |
|---|---|---|
| 1 | Section EN JEU ne dit plus "EN JEU — Vaisseaux" | `toContain("EN JEU")` + `not.toContain("EN JEU — Vaisseaux")` |
| 2 | Bouton ACTIV. dans wrapper flex-column (non superposé) | `wrapper.style.flexDirection === "column"` |
| 3 | ACTIV. absent pour base exhausted | `toBeUndefined()` |
| 4 | Tap carte ouvre modale avec bouton Fermer | bouton "Fermer" présent après click |
| 5 | Overlay modal opacity 0.85 | `style.background` contient "0.85" |
| 6 | Zone MAIN présente avec boutons JOUER | `length > 0` |
| 7 | EN JEU et MAIN sont deux zones distinctes dans le DOM | positions textuelles ordonnées |

---

## 2. Playwright / e2e mobile

**Non disponible** dans cet environnement.

`npx playwright install chromium` échoue sur Ubuntu 26.04 avec
"not supported on ubuntu26.04-x64". Le fichier `e2e/mobile-qa.spec.ts`
(PATCH 0017) contient les tests pour iPhone 12 portrait (390×844) ;
ils sont prêts à tourner dès que l'environnement supporte Chromium.

Commande disponible : `npm run test:e2e` (exécute `playwright test`).

---

## 3. Résultats

```
Tests jsdom    : 197 (190 existants + 7 nouveaux) — tous verts
Lint           : 0 erreur
Build          : OK
Playwright e2e : non exécuté (Ubuntu 26.04)
```

---

## 4. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/tests/gameboard.test.tsx` | +7 tests PATCH 0033 QA mobile (describe bloc) |

---

## 5. Confirmation scope

- Aucun gameplay modifié.
- Aucune carte modifiée.
- Aucun moteur, effet, coût ou équilibrage modifié.
- Aucune refonte UI.
- Tests intégrés à `npm run check` (via `npm test`).

---

## Hash du commit

- 31a6c58
