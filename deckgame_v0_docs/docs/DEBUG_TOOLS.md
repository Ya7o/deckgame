# DEBUG_TOOLS.md

## Objectif

Prévoir les outils nécessaires pour diagnostiquer les bugs du moteur.

## Outils V0 recommandés

- New Game.
- Restart with same seed.
- Export GameState JSON.
- Import GameState JSON.
- Copy current GameState to clipboard.
- Show all zones.
- Show instance IDs.
- Show pendingChoices.
- Show activeModifiers.
- Show activeTriggers.
- Run validateStateInvariants manually.

## Debug UI

Ajouter un panneau collapsible `Debug` réservé au dev.

## Logs

Le log doit enregistrer : setup, play_card, gain_trade, gain_combat, gain_authority, draw, discard, scrap, buy_card, refill_trade_row, attack_base, destroy_base, attack_player, activate_ally, activate_base, activate_scrap, choice_created, choice_resolved, reshuffle, end_turn, game_over.

## Seed

Le setup doit pouvoir recevoir une seed pour reproduire une partie.

## Règle

Tout bug moteur doit être reproductible via seed + GameState exporté.
