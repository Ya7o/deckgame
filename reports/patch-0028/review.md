# PATCH 0028 — Release Candidate V0

## Objectif

Valider tous les critères de sortie V0 définis en PATCH 0023.
Décider si un PATCH 0029 (RC fixes) est nécessaire.

---

## 1. Résultats de la simulation RC

### Batch principal : 200 parties (seeds 3000-3199)

| Métrique | Valeur | Seuil | Statut |
|---|---|---|---|
| Erreurs moteur | 0 | 0 | ✅ PASS |
| Violations d'invariant | 0 | 0 | ✅ PASS |
| MaxTurns atteint | 0 (0,0%) | ≤ 5% | ✅ PASS |
| WinRate P1 | 51,5% | < 70% | ✅ PASS |
| WinRate P2 | 48,5% | < 70% | ✅ PASS |
| Tours moyens | 31,1 | < 80 | ✅ PASS |
| Tours médians | 30 | — | ✅ OK |

### Profils bot (50 parties chacun, seeds 4000-4049)

| Profil P1 | Profil P2 | WinRate P1 | Erreurs | Violations |
|---|---|---|---|---|
| balanced | balanced | 54% | 0 | 0 |
| aggressive | balanced | 44% | 0 | 0 |
| economy | balanced | 36% | 0 | 0 |
| defensive | balanced | 38% | 0 | 0 |

Tous les profils terminent sans erreur moteur ni violation d'invariant.

---

## 2. Validation des critères de sortie V0

### 3.1 Critères qualité moteur

| Critère | Statut |
|---|---|
| npm run check : lint 0 erreur, 190 tests, build OK | ✅ |
| 0 erreur moteur sur 200 parties | ✅ |
| 0 violation d'invariant sur 200 parties | ✅ |
| maxTurns jamais atteint (0% sur 200 parties) | ✅ |
| 4 profils bot terminent sans erreur | ✅ |

### 3.2 Critères qualité règles

| Critère | Statut |
|---|---|
| Effet allié Dreadnaught implémenté | ✅ PATCH 0024 |
| Validation minimum opponent_discard correcte | ✅ PATCH 0024 |
| Règle P1 draw-3 documentée | ✅ PATCH 0024 |

### 3.3 Critères UX mobile

| Critère | Statut |
|---|---|
| Tap carte = détail (badge JOUER/ACHAT) | ✅ PATCH 0014-0016 |
| Achat uniquement via bouton explicite ACHAT | ✅ PATCH 0014 |
| Main bot non exposée | ✅ PATCH 0013 |
| Actions humaines bloquées pendant tour bot | ✅ PATCH 0013 |
| Ressources lisibles sur mobile | ✅ Resource bar |
| Activation base via badge ACTIV. | ✅ PATCH 0026 |

### 3.4 Critères documentation

| Critère | Statut |
|---|---|
| README.md à jour avec commandes | ✅ PATCH 0027 |
| docs/v0-release-notes.md | → PATCH 0030 |
| reports/patch-0023 à 0027 complétés | ✅ |

---

## 3. Décision PATCH 0029

**Aucun bloquant identifié.**

- Tous les critères moteur, règles et UX sont verts.
- Aucune régression détectée dans la simulation 200 parties.
- Aucun P0/P1 ouvert dans le backlog.

**PATCH 0029 (RC fixes) non nécessaire.**

La V0 est prête pour le tag. Procéder directement à PATCH 0030.

---

## 4. Observations non bloquantes

- WinRate balanced vs balanced à 51-54% sur 50 parties (variance normale).
  Sur 200 parties : 51,5% — dans la fourchette attendue (53-54% historique).
- Tours moyens : 31 — cohérent avec les mesures PATCH 0019-0022 (25-35).
- aggressive vs balanced : P1=44% — profil agressif pénalisé en P1 (pioche de 3).
  Documenté comme comportement connu.

---

## 5. Hash du commit

- A remplir après git push
