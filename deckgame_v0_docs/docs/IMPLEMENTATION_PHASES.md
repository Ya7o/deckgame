# IMPLEMENTATION_PHASES.md

## Phase 1 — moteur minimal

Objectif : partie simplifiée jouable avec Scouts, Vipers, Explorer.

À implémenter : setupGame, drawCards, playCard, gain Trade/Combat/Authority, buyExplorer, attackOpponent, endTurn, checkGameEnd.

Validation : une partie peut atteindre game_over avec cartes simples.

## Phase 2 — Trade Row complète

Objectif : achat de cartes du Trade Deck.

À implémenter : core-set.cards.ts, createTradeDeck, buyTradeRowCard, refillTradeRow, achats multiples.

Validation : cartes achetées reviennent après reshuffle.

## Phase 3 — Bases et Outposts

Objectif : gérer les permanents.

À implémenter : play Base, activateBase, exhausted, attackBase, outpost blocking, self-scrap base.

Validation : Outpost bloque et se détruit correctement.

## Phase 4 — effets standards

Objectif : draw, scrap, choose one, discard opponent, destroy base.

Validation : tests dédiés passent.

## Phase 5 — ally abilities

Objectif : synergies de faction.

À implémenter : hasAlly, getEffectiveFactions, activatedAllyEffectsThisTurn, Bases comme alliés.

Validation : pas de double activation.

## Phase 6 — cartes complexes

Objectif : traiter les cas spéciaux.

Ordre conseillé : Fleet HQ, Mech World, Brain World, Blob Carrier, Freighter/Central Office, Embassy Yacht, Stealth Needle, Blob World.

## Phase 7 — UI mobile-first

Objectif : interface utilisable.

À implémenter : GameBoard, CardView, CardDetailModal, ResourceBar, TradeRow, PendingChoicePanel, GameLog.

## Phase 8 — smoke test complet

Objectif : partie complète avec Core Set sans invariant cassé.
