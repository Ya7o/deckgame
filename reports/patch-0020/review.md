# PATCH 0020 — Exploiter les simulations Bot vs Bot — Rapport d'équilibrage baseline

## Objectif

Exploiter le runner de simulation de PATCH 0019 pour produire un premier rapport
d'équilibrage quantitatif. Aucune correction d'équilibrage n'est faite dans ce patch.

---

## 1. Méthode

- **Outil** : `runBatch()` depuis `src/game/simulate.ts` (PATCH 0019)
- **Volume** : 400 parties (seeds 1–400, deux lots de 200)
- **Profil bot** : unique (heuristique standard — PATCH 0021 ajoutera des profils)
- **maxTurns** : 200 (jamais atteint dans ce batch)
- **Données brutes** : `reports/patch-0020/data/simulation-results.json`

---

## 2. Résultats bruts (400 parties)

```
Terminées par victoire     : 400/400 (100%)
MaxTurns atteint           : 0
Erreurs moteur             : 0
Violations d'invariant     : 0

Victoires player_1         : 219 (54.8%)
Victoires player_2         : 181 (45.2%)
Aucun gagnant              : 0

Tours moy / méd / min / max: 31.7 / 30 / 17 / 62
Actions moyennes/partie    : 324.0–331.6

Autorité moyenne du gagnant en fin de partie : 33.5
Autorité moyenne du perdant en fin de partie : -6.6

Seeds suspectes : aucune
```

**Distribution des durées :**

| Tranche de tours | Nombre de parties | % |
|---|---|---|
| 10–19 | 10 | 2.5% |
| 20–29 | 168 | 42.0% |
| 30–39 | 166 | 41.5% |
| 40–49 | 47 | 11.8% |
| 50–59 | 7 | 1.75% |
| 60–69 | 2 | 0.5% |

---

## 3. Matrice d'analyse

| Métrique | Valeur mesurée | Seuil | Verdict | Risque |
|---|---|---|---|---|
| Taux de complétion | 100% | ≥ 95% | ✓ OK | Aucun |
| MaxTurns atteint | 0 (0%) | ≤ 5% | ✓ OK | Aucun |
| Erreurs moteur | 0 | 0 | ✓ OK | Aucun |
| Violations invariant | 0 | 0 | ✓ OK | Aucun |
| Winrate player_1 | 54.8% | ≤ 65% | ✓ OK | Faible |
| Winrate player_2 | 45.2% | ≤ 65% | ✓ OK | Faible |
| Durée moyenne | 31.7 tours | ≤ 80 | ✓ OK | Aucun |
| Durée médiane | 30 tours | — | ✓ OK | Aucun |
| Durée min | 17 tours | — | ✓ OK | Aucun |
| Durée max | 62 tours | — | ✓ OK | Aucun |
| Autorité gagnant | 33.5 | > 0 | ✓ OK | Aucun |
| Autorité perdant | -6.6 | — | normal | Légère |

---

## 4. Observations

### 4.1 Avantage P1 : 54.8% vs 45.2%

L'avantage du premier joueur est modéré. Il est en dessous du seuil d'alerte (65%).
Deux facteurs pourraient l'expliquer :

1. **Avantage naturel du premier joueur** (premier accès à la rangée commerciale)
2. **P1 pioche 3 au tour 1** (mécanisme de compensation documenté en PATCH 0018 comme P1 non documenté) — mais ce mécanisme semble insuffisant à neutraliser l'avantage du premier tour.

Ce déséquilibre sera examiné en PATCH 0022.

### 4.2 Durée des parties

83.5% des parties se terminent entre 20 et 40 tours. C'est cohérent avec un jeu
de deckbuilding bien progressif. Les parties courtes (< 20 tours) représentent
2.5% — typiquement des mains de départ très offensives. Les parties longues
(> 50 tours) représentent 2.25% — des configurations défensives.

### 4.3 Autorité finale du perdant

La valeur moyenne de -6.6 indique que le coup fatal dépasse légèrement le seuil
de 0. C'est normal et attendu (attaquer avec tout son combat en dernier tour).

### 4.4 Aucun blocage détecté

Aucun des 400 scénarios ne produit de boucle infinie, d'erreur moteur ou de
violation d'invariant. Le moteur est stable.

---

## 5. Seuils d'alerte définis

| Alerte | Seuil | Valeur actuelle | Déclenché |
|---|---|---|---|
| MaxTurns > 5% | 5% | 0% | Non |
| Winrate P1 > 65% | 65% | 54.8% | Non |
| Winrate P2 > 65% | 65% | 45.2% | Non |
| Durée moy > 80 tours | 80 | 31.7 | Non |
| Erreurs moteur > 0 | 0 | 0 | Non |
| Violations invariant > 0 | 0 | 0 | Non |

---

## 6. Tests ajoutés

Fichier : `deckgame/src/tests/balance.test.ts`

```
describe("PATCH 0020 — Seuils de stabilité baseline")
  ✓ 50 parties : aucune erreur moteur ni violation d'invariant
  ✓ 50 parties : maxTurns jamais atteint (seuil 5%)
  ✓ 50 parties : winrate P1 < 70% (seuil déséquilibre fort)
  ✓ 50 parties : winrate P2 < 70% (seuil déséquilibre fort)
  ✓ 50 parties : durée moyenne < 80 tours
  ✓ résumé batch contient toutes les métriques attendues
```

---

## 7. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 143 passed (69 moteur + 25 bot + 14 i18n + 19 gameboard jsdom + 10 simulate + 6 balance)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## 8. Limites

- **Reshuffles non déterministes** : seeds identiques ne produisent pas exactement les mêmes parties (voir PATCH 0018/0019). Les statistiques restent valables sur 400 parties.
- **Un seul profil bot** : le bot joue la même heuristique des deux côtés. PATCH 0021 permettra de comparer des profils différents.
- **400 parties** : échantillon raisonnable mais pas exhaustif. Les conclusions sont indicatives.
- **Pas de preuves visuelles** : capture non requise pour une analyse quantitative.

---

## 9. Aucune correction d'équilibrage dans ce patch

Les données sont collectées. Les corrections sont reportées en PATCH 0022
après ajout des profils bot (PATCH 0021) pour des mesures plus comparables.

---

## 10. Prochains patchs

| Patch | Titre |
|---|---|
| **PATCH 0021** | Ajouter des profils bot configurables |
| **PATCH 0022** | Corriger les déséquilibres détectés par les simulations |

---

## Hash du commit

12485ff
