# CARD_DATABASE_LOCK.md

## 1. Objectif

Figer la base de cartes utilisée pour la V0 afin d’éviter les versions contradictoires.

## 2. Source de vérité

La source de vérité de la V0 est :

- `docs/STAR_REALMS_CORE_CARDS.csv`
- copie technique : `data/star-realms-core-cards.csv`
- export TypeScript : `data/core-set.cards.ts`

Si un conflit existe entre les documents, le CSV verrouillé prime.

## 3. Totaux verrouillés

| Bloc | Quantité |
|---|---:|
| Blob | 20 |
| Machine Cult | 20 |
| Star Empire | 20 |
| Trade Federation | 20 |
| Trade Deck total | 80 |
| Explorer | 10 |
| Scout | 16 |
| Viper | 4 |

## 4. Corrections consolidées

- `Blob Wheel` = 3 exemplaires.
- `Port of Call` : primary `gain_trade:3`; scrap `draw:1;destroy_target_base_optional`.
- `Trading Post` : choix `gain_authority:1` ou `gain_trade:1`; scrap `gain_combat:3`.
- `Defense Center` : choix `gain_authority:3` ou `gain_combat:2`; ally `gain_combat:2`.
- `Blob World` : défense verrouillée à 7 pour la V0, mais texte exact à vérifier avant exploitation hors prototype.

## 5. Cartes complexes à isoler

- Blob World
- Stealth Needle
- Mech World
- Fleet HQ
- Brain World
- Blob Carrier
- Central Office
- Freighter
- Embassy Yacht
- Recycling Station

## 6. Règle de modification

Toute modification de carte doit être faite dans le CSV puis répercutée dans `data/core-set.cards.ts`. Ne jamais modifier directement le fichier TypeScript sans mettre à jour le CSV.
