# PATCH 0021 — Profils bot configurables

## Objectif

Extraire la logique de décision du bot dans un module `bot-profile.ts` indépendant
et définir 4 profils jouables : **balanced**, **aggressive**, **economy**, **defensive**.
Chaque profil paramètre la stratégie d'achat et d'attaque sans modifier les règles du moteur.

## Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/game/bot-profile.ts` | **NOUVEAU** — types BotProfile, 4 profils, chooseBestBuy, chooseAttackTarget |
| `src/game/bot.ts` | Ajout BotOptions, profil passé à tryBotBuy / tryBotAttack |
| `src/game/simulate.ts` | profileP1/profileP2 dans options + résultats, runBatch étendu |
| `src/tests/bot-profile.test.ts` | **NOUVEAU** — 14 tests de couverture |

## Profils définis

| Profil | buyStrategy | combatW | tradeW | defenseW | directAttack | aggressionThr |
|---|---|---|---|---|---|---|
| balanced | cost_first | 0.5 | 0.5 | 0.3 | false | 1.0 |
| aggressive | efficiency | 0.8 | 0.2 | 0.1 | true | 0.6 |
| economy | efficiency | 0.2 | 0.8 | 0.2 | false | 1.0 |
| defensive | efficiency | 0.3 | 0.4 | 0.8 | false | 1.2 |

`balanced` conserve intentionnellement `cost_first` pour rester rétrocompatible
avec le comportement original du bot (achat de la carte la plus chère abordable).

## Tests

```
Tests :  157 passes (14 nouveaux dans bot-profile.test.ts)
Lint  :  0 erreurs
Build :  OK
```

## Données de simulation (50 parties par matchup, seeds 1-50)

| Matchup | WinRate P1 | WinRate P2 | AvgTurns | Erreurs moteur |
|---|---|---|---|---|
| balanced vs balanced | 46 % | 54 % | 30.1 | 0 |
| aggressive vs balanced | 36 % | 64 % | 29.6 | 0 |
| economy vs balanced | 38 % | 62 % | 32.8 | 0 |
| defensive vs balanced | 48 % | 52 % | 34.2 | 0 |
| aggressive vs economy | 50 % | 50 % | 29.9 | 0 |
| aggressive vs aggressive | 46 % | 54 % | 29.0 | 0 |
| economy vs economy | 36 % | 64 % | 30.0 | 0 |
| defensive vs defensive | 48 % | 52 % | 32.9 | 0 |

### Observations

- **aggressive** et **economy** perdent contre **balanced** (36-38 % de victoires P1).
  La stratégie `efficiency` dans l'état actuel du jeu ne surpasse pas `cost_first` —
  les cartes generiques favorisent la carte la plus chere.
- **defensive** est le profil le plus proche de balanced (48 % — ecart dans la marge
  d'echantillonnage de 50 parties).
- Aucune erreur moteur ni violation d'invariant sur tous les matchups.
- Les parties avec profil aggressive sont plus courtes (29.0 tours en miroir),
  les parties defensive sont plus longues (34-35 tours).

### Implication pour PATCH 0022

L'avantage P2 observe ici est coherent avec les donnees PATCH 0020 (balanced vs balanced
historique : P1=48 %, P2=52 %). Le desequilibre n'est pas introduit par les profils.
PATCH 0022 devra traiter la cause racine identifiee dans l'audit 0018.

## Commits

- 1197691e35c30bf9dacf0ccb3820d8590136e0b5 (PATCH 0021)
