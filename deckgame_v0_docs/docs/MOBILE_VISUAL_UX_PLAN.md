# MOBILE_VISUAL_UX_PLAN.md

## Objectif

Construire une UI V0 simple, responsive, mobile portrait first.

## Principe

Moche mais lisible. Simple mais jouable. Pas de polish visuel tant que le moteur n’est pas stable.

## Layout portrait

```text
┌─────────────────────────────┐
│ Adversaire: Authority/Bases │
├─────────────────────────────┤
│ Trade Row: 5 cartes         │
├─────────────────────────────┤
│ Zone centrale / cartes jouées│
├─────────────────────────────┤
│ ResourceBar: Trade/Combat   │
├─────────────────────────────┤
│ Main joueur actif           │
├─────────────────────────────┤
│ ActionBar / End Turn        │
└─────────────────────────────┘
```

## Zones visibles

- Authority des deux joueurs.
- Deck count / discard count.
- Bases et Outposts.
- Trade Row.
- Explorer pile.
- Main du joueur actif.
- Cartes jouées ce tour.
- Trade et Combat actuels.
- Pending choices.
- Log compact.

## Interaction

- Tap/click sur carte : détail + actions.
- Pas de drag and drop en V0.
- Boutons tactiles de hauteur minimum 44px.
- Boutons désactivés si action illégale.

## Carte compacte

Afficher : nom, coût, faction, type, effet résumé, défense si Base, badge Outpost si applicable.

## Vue détaillée

Modal ou bottom sheet avec texte complet, effets structurés, zone actuelle, actions disponibles.

## Pending choices

Un pending choice bloque le reste de l’interface. Le panneau doit proposer les sélections valides et un bouton skip si optionnel.

## Feedback minimum

- Ressources mises à jour visiblement.
- Carte jouée quitte la main.
- Carte achetée quitte Trade Row.
- Authority baisse après attaque.
- Outpost affiche un badge PROTECTED.
- Ally active visible si possible.

## Critères d’acceptation mobile

- Jouable dans navigateur mobile.
- Ressources toujours visibles.
- Cartes lisibles via vue détaillée.
- Boutons utilisables au doigt.
- Choix en attente compréhensibles.
