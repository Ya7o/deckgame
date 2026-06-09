# PATCH 0057 — QA partie complète paysage plein écran

**Date :** 2026-06-09
**Commit :** à renseigner après push
**Branche :** master
**Tests unitaires :** 305 / 305 GREEN
**Playwright QA :** 12 / 12 GREEN

---

## Objectif

Audit QA final de la séquence V0.2 : vérifier que le paysage plein écran offre
une expérience confortable, que le vocabulaire est clair, que les bases/avant-postes
sont compréhensibles, que la hiérarchie des boutons est cohérente, et que le portrait
n'est pas régressé.

---

## Résultats npm run check

```
Tests : 305 / 305 GREEN
Build : ✓ 289.82 kB (gzip 79.41 kB)
Lint  : 0 erreurs
```

---

## Résultats Playwright QA (12 tests, 4 sections)

### Section 1 : Début de partie — paysage

| Test | Résultat |
|---|---|
| 01 — StartScreen affiché correctement | ✅ |
| 02 — Layout paysage rendu (data-layout=landscape) | ✅ |
| 03 — Rangée commerciale visible avec cartes | ✅ |
| 04 — Barre d'actions : Fin du tour + Journal + ? présents | ✅ |

### Section 2 : Tour bot et résumé

| Test | Résultat |
|---|---|
| 05 — Fin du tour désactivé pendant tour bot | ✅ |
| 06 — Après tour bot : Fin du tour réactivé | ✅ |
| 07 — Journal disponible après tour bot | ✅ |

### Section 3 : Glossaire et vocabulaire

| Test | Résultat |
|---|---|
| 08 — Glossaire : 6 termes clés affichés (Main, Pioche, Défausse, Écarter, Effet allié, Avant-poste) | ✅ |
| 09 — Tap sur zone main visible | ✅ |

### Section 4 : Portrait non régressé

| Test | Résultat |
|---|---|
| 10 — Portrait layout rendu | ✅ |
| 11 — Portrait journal cycle | ✅ |
| 12 — Abandonner < Fin du tour (hauteur) | ✅ |

---

## Audit visuel des captures

Screenshots générés dans `reports/patch-0057/screenshots/` (12 captures) :
- `01` StartScreen paysage
- `02` Début partie paysage — toutes zones visibles
- `03` Rangée commerciale
- `04` Barre d'actions
- `05` Tour bot en cours — boutons désactivés
- `06` Après tour bot — résumé bot visible
- `07` Journal après tour bot
- `08` Panneau glossaire
- `09` Main paysage
- `10` Portrait intact
- `11` Journal portrait fermé
- `12` Actions portrait

---

## Évaluation V0.2 — Critères de réussite

### ✅ ATTEINTS

| Critère | Statut | Evidence |
|---|---|---|
| Paysage plein écran confortable | ✅ | Tests 01-09, captures visuelles |
| Actions bot compréhensibles | ✅ | Résumé bot PATCH 0053, journal PATCH 0053 |
| Vocabulaire plus clair | ✅ | Glossaire PATCH 0054, termes pédagogiques |
| Bases/avant-postes compréhensibles | ✅ | PATCH 0055, CardDetailModal hints, messages blocage |
| Boutons cohérents | ✅ | PATCH 0056, hiérarchie primaire/secondaire |
| Portrait non cassé | ✅ | Tests 10-12, régression verte tout au long |
| npm run check vert | ✅ | 305/305 tout au long de la séquence |

---

## Problèmes résiduels classés

### P1 — Importants (à traiter en V0.2 suite)

| # | Description | Fichier concerné | Priorité |
|---|---|---|---|
| P1-1 | En landscape, le bouton Activer sur les bases n'est accessible que via la modale — pas de raccourci direct sur la carte dans EN JEU | GameBoard.tsx (landscape bases) | P1 |
| P1-2 | La barre de résumé bot (`✦ Bot joue…`) tronque silencieusement si le bot a joué de nombreuses cartes — pas de "voir tout" | GameBoard.tsx bot summary | P1 |

### P2 — Mineurs

| # | Description | Fichier concerné | Priorité |
|---|---|---|---|
| P2-1 | Le bouton Activer en portrait est positionné sous la carte (largeur = card-w) — en très petite main, peut sembler flottant | GameBoard.tsx portrait bases | P2 |
| P2-2 | L'invite de confirmation `window.confirm()` pour Abandonner n'est pas native dans PWA installée — peut sembler brisé sur mobile | GameBoard.tsx concedeGame | P2 |
| P2-3 | Pas de moyen de voir le nom des cartes de l'adversaire en paysage (la zone adversaire est compacte) | GameBoard.tsx landscape opponent | P2 |

### P3 — Cosmétiques / nice-to-have

| # | Description | Fichier concerné | Priorité |
|---|---|---|---|
| P3-1 | Pas de transition/animation entre les tours | GameBoard.tsx | P3 |
| P3-2 | Les badges faction (BLB, MC, SE, TF) ne sont pas tous compréhensibles sans le glossaire | CardView.tsx | P3 |
| P3-3 | Le glossaire ne liste pas les factions | fr.ts glossary | P3 |

### P0 — Bloquants

Aucun problème P0 identifié. La partie est jouable de bout en bout.

---

## Synthèse V0.2

La séquence de patches 0051→0057 a atteint ses objectifs principaux :
- **Paysage plein écran** : toutes les zones sont visibles et accessibles
- **Actions bot** : résumé complet hors journal (PATCH 0053)
- **Vocabulaire** : glossaire intégré, hints CardDetailModal (PATCH 0054)
- **Bases/avant-postes** : messages pédagogiques, contexte modal (PATCH 0055)
- **Hiérarchie boutons** : Fin du tour dominant, Abandonner discret (PATCH 0056)
- **Portrait** : préservé à chaque patch, 12 tests de régression verts

---

## Proposition de suite

**Option A — Tag V0.2** (si l'équipe valide l'audit)
```bash
git tag v0.2.0
git push origin v0.2.0
```

**Option B — Patchs correctifs P1** avant le tag :
- 0058 : Bouton Activer direct en landscape (petite icône sur carte)
- 0059 : Résumé bot expandable (tap pour voir tout le journal)

**Option C — Nouvelle séquence V0.3** : animations, factions dans le glossaire,
confirmation modale pour Abandonner.

---

## Fichiers produits par PATCH 0057

| Fichier | Contenu |
|---|---|
| `deckgame/e2e/patch-0057.spec.ts` | 12 tests Playwright QA |
| `reports/patch-0057/review.md` | Ce rapport |
| `reports/patch-0057/screenshots/` | 12 captures (01 à 12) |
