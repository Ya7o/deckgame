# TEST_SCENARIOS.md

## Objectif

Valider le moteur avant l’UI avancée.

## Setup

- `setupGame()` crée deux joueurs.
- Chaque joueur a 50 Authority.
- Chaque joueur possède 8 Scouts + 2 Vipers au total.
- Joueur 1 a 3 cartes en main.
- Joueur 2 a 5 cartes en main.
- Trade Row contient 5 cartes.
- Trade Deck contient 75 cartes après remplissage.
- Explorer pile contient 10 cartes.

## Mouvements

- Ship main → inPlay.
- Base main → bases.
- End turn : inPlay + main → discard.
- Bases restent en jeu.
- Une CardInstance ne peut exister que dans une zone.

## Ressources

- Scout donne +1 Trade.
- Viper donne +1 Combat.
- Trade reset en fin de tour.
- Combat reset en fin de tour.
- Authority peut dépasser 50.

## Achat

- Acheter une carte réduit Trade.
- La carte achetée va en discard.
- Trade Row se remplit.
- Acheter Explorer ne modifie pas Trade Row.
- Action refusée si Trade insuffisant.
- Action refusée si Explorer pile vide.

## Pioche / reshuffle

- Pioche normale.
- Si deck vide, discard est mélangé.
- Si deck + discard vides, pas de crash.

## Combat

- Attaque directe réduit Authority.
- Attaque partielle possible.
- Action refusée si Combat insuffisant.
- Game over si Authority <= 0.

## Bases / Outposts

- Base reste en jeu.
- Base activable une fois par tour.
- Reset exhaustion au prochain tour du propriétaire.
- Base détruite va en discard propriétaire.
- Outpost bloque attaque directe.
- Détruire Outpost permet ensuite d’attaquer avec Combat restant.

## Ally

- Une carte seule n’active pas son ally.
- Deux cartes même faction activent leurs ally effects.
- Une Base compte comme alliée.
- Mech World compte comme allié universel.
- Pas de double activation du même ally effect.

## Scrap

- Scrap main.
- Scrap discard.
- Scrap Trade Row + refill.
- Self-scrap Explorer.
- Self-scrap Base.
- Skip optionnel.

## Choix

- Patrol Mech : Trade ou Combat.
- Trading Post : Authority ou Trade.
- Defense Center : Authority ou Combat.
- Recycling Station : Trade ou discard/draw.

## Cartes complexes

- Fleet HQ trigger non rétroactif.
- Stealth Needle copie un Ship, jamais une Base.
- Blob Carrier acquiert gratuitement un Ship au top deck.
- Freighter/Central Office topdeckent le prochain Ship acquis.
- Embassy Yacht pioche si au moins 2 Bases.
- Brain World scrap jusqu’à 2 puis draw égal au nombre scrappé.

## Smoke test

Simuler une partie complète jusqu’à `game_over` sans violation d’invariants.
