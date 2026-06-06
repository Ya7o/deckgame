# STAR_REALMS_CORE_RULES.md

## 1. Objectif du jeu

Star Realms est un deckbuilder duel. Chaque joueur commence avec un deck faible, achète des cartes depuis une Trade Row commune, améliore son deck au fil des reshuffles et tente de réduire l’Authority adverse à 0.

Condition de victoire : un joueur perd si son Authority est inférieure ou égale à 0.

## 2. Ressources

| Ressource | Fonction |
|---|---|
| Trade | Acheter des cartes |
| Combat | Attaquer l’adversaire ou ses Bases |
| Authority | Points de vie du joueur |
| Scrap | Retirer une carte définitivement du jeu |

Trade et Combat sont temporaires et disparaissent en fin de tour. Authority peut dépasser 50.

## 3. Setup

- 2 joueurs.
- Chaque joueur commence à 50 Authority.
- Chaque joueur reçoit 8 Scouts et 2 Vipers.
- Le joueur 1 pioche 3 cartes.
- Le joueur 2 pioche 5 cartes.
- Le Trade Deck de 80 cartes est mélangé.
- La Trade Row révèle 5 cartes.
- Une pile séparée contient 10 Explorers.
- Le joueur 1 commence.

## 4. Types de cartes

### Ship

Un Ship est joué depuis la main, applique ses effets, reste en zone `inPlay` pendant le tour, puis part en défausse en fin de tour.

### Base

Une Base reste en jeu jusqu’à destruction. Elle peut produire un effet récurrent quand elle est activée.

### Outpost

Un Outpost est une Base qui bloque l’attaque directe contre l’Authority du joueur tant qu’il reste en jeu.

## 5. Structure de tour

Pendant son tour, le joueur peut faire les actions autorisées dans un ordre flexible :

1. Jouer des cartes.
2. Activer des Bases.
3. Résoudre des choix en attente.
4. Acheter des cartes.
5. Attaquer des Bases.
6. Attaquer l’adversaire si aucun Outpost adverse ne bloque.
7. Activer des effets de scrap.
8. Terminer son tour.

En fin de tour :

- les Ships joués vont en défausse ;
- les cartes restantes en main vont en défausse ;
- les Bases restent en jeu ;
- Trade et Combat reviennent à 0 ;
- le joueur pioche une nouvelle main de 5 ;
- le tour passe à l’adversaire.

## 6. Achat

- Une carte achetée depuis la Trade Row va dans la défausse, sauf effet spécial.
- La Trade Row est immédiatement remplie après achat ou scrap d’une carte du marché.
- Explorer est acheté depuis une pile séparée et ne déclenche pas de refill de Trade Row.
- Plusieurs achats sont possibles si le joueur a assez de Trade.

## 7. Combat

- Combat peut être dépensé contre une Base adverse ou contre l’Authority adverse.
- V0 : pas de dégâts partiels sur les Bases. Il faut dépenser au moins la défense complète pour détruire la Base.
- Si l’adversaire a un Outpost, l’attaque directe contre son Authority est interdite.
- Après destruction d’un Outpost, le Combat restant peut être utilisé.

## 8. Ally abilities

Une ally ability est active si le joueur a une autre carte de la même faction en jeu, dans `inPlay` ou `bases`. La carte ne s’active pas elle-même. Deux cartes de même faction peuvent s’activer mutuellement. Une ally ability ne doit pas s’activer deux fois dans le même tour.

Mech World compte comme allié pour toutes les factions.

## 9. Scrap

Une carte scrappée va dans la Scrap Heap et ne revient plus en jeu. Scrapper une carte depuis main/défausse ne déclenche pas son propre effet de scrap. Une carte qui se self-scrap applique son scrap effect puis quitte le jeu.

## 10. Pioche et reshuffle

Quand un joueur doit piocher et que son deck est vide, sa défausse est mélangée pour former un nouveau deck. Si deck et défausse sont vides, il pioche autant que possible.

## 11. Points de vigilance V0

- Effet exact de Blob World à vérifier avant version non prototype.
- Timing de discard adverse simplifié en V0 : choix résolu par pending choice.
- Stealth Needle, Fleet HQ, Mech World, Brain World et Blob Carrier doivent être testés séparément.
