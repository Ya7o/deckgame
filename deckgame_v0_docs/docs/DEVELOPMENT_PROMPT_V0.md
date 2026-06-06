# DEVELOPMENT_PROMPT_V0.md

## Prompt à envoyer à Claude Code / Codex

Tu es chargé de développer une V0 technique privée d’un jeu de cartes deckbuilding reproduisant mécaniquement le Core Set de Star Realms.

Statut : prototype technique privé, non publié, non marketé, non monétisé.

Objectif : créer une application web locale jouable en 1v1 de setup à victoire, avec moteur pur séparé de l’UI.

## Stack imposée

- Vite
- React
- TypeScript
- Vitest
- Pas de backend
- Pas d’authentification
- Pas de online multiplayer

## Architecture attendue

```text
/src
  /game
    engine.ts
    state.ts
    actions.ts
    effects.ts
    rules.ts
    selectors.ts
    validators.ts
    types.ts
  /data
    core-set.cards.ts
  /ui
    GameBoard.tsx
    PlayerArea.tsx
    OpponentArea.tsx
    CardView.tsx
    CardDetailModal.tsx
    TradeRow.tsx
    ResourceBar.tsx
    GameLog.tsx
    PendingChoicePanel.tsx
    ActionBar.tsx
  /tests
    setup.test.ts
    movement.test.ts
    resources.test.ts
    buying.test.ts
    combat.test.ts
    bases.test.ts
    ally.test.ts
    scrap.test.ts
    special-cards.test.ts
```

## Règles clés

- 2 joueurs.
- Chaque joueur commence à 50 Authority.
- Chaque joueur commence avec 8 Scouts + 2 Vipers.
- Joueur 1 pioche 3 cartes.
- Joueur 2 pioche 5 cartes.
- Trade Row de 5 cartes.
- Trade Deck de 80 cartes Core Set.
- Explorer pile de 10 cartes.
- Les cartes achetées vont en défausse sauf effet spécial.
- Les Ships joués vont en défausse en fin de tour.
- Les Bases restent en jeu.
- Les Outposts bloquent l’attaque directe.
- Trade et Combat disparaissent en fin de tour.
- Si deck vide, reshuffle de la défausse.
- Victoire quand Authority adverse <= 0.

## Actions moteur publiques

- setupGame
- playCard
- activateBase
- buyTradeRowCard
- buyExplorer
- attackBase
- attackOpponent
- activateSelfScrap
- resolvePendingChoice
- endTurn
- concedeGame

Chaque action retourne :

```ts
type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; error: EngineError };
```

Une action illégale ne modifie jamais l’état.

## Données de cartes

Utiliser `data/core-set.cards.ts` comme base. Si une carte complexe est incertaine, implémenter l’hypothèse V0 documentée et ajouter un TODO clair.

## UI minimale mobile-first

Créer une interface responsive mobile portrait first.

Zones obligatoires :

- Authority des deux joueurs.
- Deck count / discard count.
- Bases et Outposts.
- Main du joueur actif.
- Cartes jouées ce tour.
- Trade Row.
- Explorer pile.
- Trade / Combat actuels.
- Log compact.
- PendingChoicePanel bloquant.

Interaction : tap/click + boutons contextuels. Pas de drag and drop obligatoire.

Cartes : rectangles textuels, vue compacte + vue détaillée.

## Tests Vitest obligatoires

Implémenter les tests décrits dans `docs/TEST_SCENARIOS.md`, au minimum : setup, mouvements, ressources, achat, pioche/reshuffle, combat, bases/outposts, ally, scrap, choix, cartes complexes, smoke test complet.

## Debug

Ajouter en dev :

- New Game.
- Export GameState JSON.
- Show log.
- Show debug state.
- Seed optionnelle.
- validateStateInvariants après actions en mode test/dev.

## Ordre d’implémentation

1. Moteur minimal : setup, Scout, Viper, Explorer, achat, combat direct, end turn, reshuffle, victoire.
2. Trade Row complète.
3. Bases/Outposts.
4. Effets standards.
5. Ally abilities.
6. Cartes complexes.
7. UI mobile-first propre.
8. Smoke test complet.

## Critères de fin

- `npm install` fonctionne.
- `npm run dev` lance l’application.
- `npm test` lance les tests.
- Une partie complète est jouable.
- La victoire fonctionne.
- Le moteur est séparé de l’UI.
- Les cartes sont données structurées.
- L’UI est utilisable en navigateur mobile.
- Les TODO/incertitudes restants sont listés.
