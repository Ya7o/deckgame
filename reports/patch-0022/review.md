# PATCH 0022 — Corriger les desequilibres detectes par les simulations

## Objectif

Appliquer des corrections minimales et justifiees par les donnees des PATCH 0020 et 0021
pour reduire les desequilibres mesures entre les profils bot.

---

## 1. Analyse des donnees disponibles

### Sources consultees

- `reports/patch-0020/review.md` — 400 parties balanced vs balanced
- `reports/patch-0021/data/profile-matchups.json` — 8 matchups x 50 parties
- Batch additionnel : 100 parties par matchup (avant correction)

### Problemes identifies

| Priorite | Observation | Metrique |
|---|---|---|
| P1 | avantage naturel P1 (premier joueur) | P1=53-54.8% vs balanced dans toutes les sources |
| P2 | profil aggressive sous-performant | P1=45% en position P1 (vs 53% attendu pour balanced) |
| P2 | profil economy sous-performant | P1=41% en position P1 (vs 53% attendu) |
| P3 | profil defensive leger ecart | P1=45%, dans la marge de bruit statistique |

---

## 2. Correction appliquee (1 changement)

### Fichier : `src/game/bot-profile.ts` — fonction `cardBuyScore`

**Avant** :
```typescript
return cost > 0 ? rawScore / cost : rawScore;
```

**Apres** :
```typescript
return cost > 0 ? rawScore / Math.sqrt(cost) : rawScore;
```

### Justification

La formule `rawScore / cost` penalise excessivement les cartes cheres.
Exemple avec le profil aggressive (combatWeight=0.8) :

| Carte | Cout | Combat | rawScore | /cost (avant) | /sqrt(cost) (apres) |
|---|---|---|---|---|---|
| Blob Fighter | 1 | 3 | 2.40 | **2.40** | 2.40 |
| Cutter | 2 | 2 | 1.60 | 0.80 | 1.13 |
| Battle Blob | 6 | 8 | 6.40 | 1.07 | **2.61** |

Avant : Blob Fighter (cout=1) battait Battle Blob (cout=6) => le bot achetait des cartes
de bas niveau meme avec 6+ trade disponible.
Apres : Battle Blob gagne face a Blob Fighter quand les deux sont abordables.

La formule `rawScore / sqrt(cost)` preserve le concept d'efficacite (les cartes
inefficaces restent penalisees) tout en recompensant les cartes puissantes.

Le profil `balanced` utilise `buyStrategy: cost_first` et n'est pas affecte par ce changement.

---

## 3. Resultats avant/apres

### Matchup : aggressive (P1) vs balanced (P2)

| Metric | Avant | Apres | Delta |
|---|---|---|---|
| Win rate P1 | 45.0% (N=100) | 49.5% (N=200) | +4.5% |
| Avg turns | 30.0 | 29.4 | -0.6 |
| Erreurs moteur | 0 | 0 | 0 |

### Matchup : economy (P1) vs balanced (P2)

| Metric | Avant | Apres | Delta |
|---|---|---|---|
| Win rate P1 | 41.0% (N=100) | 47.0% (N=200) | +6.0% |
| Avg turns | 32.4 | 32.0 | -0.4 |
| Erreurs moteur | 0 | 0 | 0 |

### Matchup : balanced (P1) vs balanced (P2) — regression check

| Metric | PATCH 0020 (400p) | PATCH 0022 (200p) | Delta |
|---|---|---|---|
| Win rate P1 | 54.8% | 53.5% | -1.3% (bruit stat.) |
| Avg turns | 31.7 | 31.1 | -0.6 |
| Erreurs moteur | 0 | 0 | 0 |

Le profil `balanced` n'est pas affecte (il utilise `cost_first`, pas `efficiency`).

### Matchup : defensive (P1) vs balanced (P2)

| Metric | Avant | Apres | Delta |
|---|---|---|---|
| Win rate P1 | 45.0% (N=100) | 45.0% (N=200) | 0% |
| Avg turns | 32.6 | 32.2 | -0.4 |
| Erreurs moteur | 0 | 0 | 0 |

---

## 4. Avantage P1 (premier joueur) — observation non corrigee

Les donnees consistantes (PATCH 0020 : 54.8% sur 400 parties ; PATCH 0022 : 53.5% sur 200 parties)
confirment un avantage P1 stable de 3-5%.

**Classification** : P1 — desequilibre modere mais non critique (seuil d'alerte = 65%).

**Analyse** : cet avantage est intrinseque au design : P1 joue ses vipers en premier
et inflige des degats avant que P2 puisse reagir. La compensation prevue (P1 pioche 3 cartes
au tour 1) semble insuffisante.

**Raison de non-correction dans ce patch** :
- Toute correction des heuristiques bot est symetrique (affecte P1 et P2 egalement)
- Corriger le desequilibre necessite une modification des regles moteur (ex. ajuster
  la pioche initiale de P1) ou de la composition du deck de depart
- Ces modifications sont hors scope de PATCH 0022

**Propose pour PATCH futur** : PATCH 0023 — Reequilibrer avantage P1 via deck de depart.

---

## 5. Limites et resultats non conclusifs

- **Echantillon** : 100-200 parties par matchup. Les ecarts de 4-6% sont en bordure de
  la marge d'erreur (std_err ≈ 3.5% pour N=200). Des conclusions definitives necessiteraient
  400+ parties.
- **Profil defensive** : aucune amelioration mesurable. Le probleme pourrait etre dans les
  poids (defenseWeight=0.8 mais peu de bases/avant-postes dans le deck de base). Reporte.
- **Reshuffles non deterministes** : les comparaisons avant/apres utilisent les memes seeds
  mais les reshuffles internes restent non-deterministes. Impact faible sur les statistiques.

---

## 6. Tests passes

```
Tests :  157 passes (aucun test modifie, aucune regression)
Lint  :  0 erreurs
Build :  OK (dist/index.js 264 kB)
```

---

## 7. Fichiers modifies

| Fichier | Nature |
|---|---|
| `src/game/bot-profile.ts` | 1 ligne modifiee : formule efficiency |
| `reports/patch-0022/data/before-after.json` | donnees comparatives |
| `reports/patch-0022/review.md` | ce rapport |

---

## Hash du commit

- 24bee09eaf7480a11069fb51b9bf57ae1b8fc0f7 (PATCH 0022)
