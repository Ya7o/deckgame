# ENGINE_ACTIONS.md

## Principe

Toutes les actions retournent :

```ts
type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; error: EngineError };
```

Une action illégale ne modifie jamais l’état.

## Actions publiques

### `setupGame(options?)`

Crée les joueurs, decks de départ, Trade Deck, Trade Row, Explorer pile, Authority, mains initiales et phase `action_phase`.

### `playCard(state, playerId, cardInstanceId)`

Valide joueur actif, phase, pending choices. Déplace la carte depuis la main vers `inPlay` ou `bases`, applique triggers, effets principaux et ally effects.

### `activateBase(state, playerId, baseInstanceId)`

Active une Base non exhausted, applique ses effets, marque `exhausted = true`.

### `buyTradeRowCard(state, playerId, cardInstanceId)`

Valide Trade, déplace carte vers discard ou top deck si modifier actif, puis refill Trade Row.

### `buyExplorer(state, playerId)`

Coût 2 Trade. Déplace Explorer vers discard ou top deck si modifier actif. Ne refill pas Trade Row.

### `attackBase(state, playerId, baseInstanceId)`

Valide Combat suffisant. Déduit défense. Déplace Base vers discard propriétaire. Retire triggers associés.

### `attackOpponent(state, playerId, amount)`

Valide Combat et absence d’Outpost adverse. Réduit Authority adverse. Vérifie fin de partie.

### `activateSelfScrap(state, playerId, cardInstanceId)`

Retire la carte en jeu vers scrapHeap, applique ses scrapEffects, supprime triggers/modifiers liés.

### `resolvePendingChoice(state, playerId, choiceId, payload)`

Résout les choix : choose one, scrap, discard, copy, destroy base, free acquire.

### `endTurn(state, playerId)`

Défausse Ships joués et main restante, conserve Bases, reset ressources, supprime modifiers expirés, pioche nouvelle main, change joueur actif.

### `concedeGame(state, playerId)`

Optionnel. Met fin à la partie.

## Fonctions internes

- `drawCards`
- `refillTradeRow`
- `moveCard`
- `applyEffects`
- `applyEffect`
- `applyAvailableAllyEffects`
- `hasAlly`
- `getEffectiveFactions`
- `checkGameEnd`
- `validateStateInvariants`

## Ordre d’implémentation

1. Setup, draw, Scout, Viper, Explorer.
2. Achat, attaque directe, fin de tour, reshuffle.
3. Bases, Outposts, activation, destruction.
4. Draw, Authority, scrap, choose one, discard opponent.
5. Ally abilities.
6. Cartes complexes.
7. UI mobile-first.
