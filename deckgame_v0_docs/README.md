# Deckgame V0 Prototype Docs

## Objectif

Ce dossier prépare le développement d’une V0 technique privée d’un deckbuilder duel reproduisant mécaniquement le Core Set de Star Realms.

## Statut

- Prototype privé.
- Core Set uniquement.
- Web local.
- UI responsive mobile-first.
- Moteur séparé de l’UI.

## Stack recommandée

- Vite
- React
- TypeScript
- Vitest

## Commandes attendues après développement

```bash
npm install
npm run dev
npm test
npm run build
```

## Structure documentaire

Voir `docs/00_INDEX.md`.

## Données de cartes

- `docs/STAR_REALMS_CORE_CARDS.csv`
- `data/star-realms-core-cards.csv`
- `data/core-set.cards.ts`

## Priorité de développement

1. Moteur minimal.
2. Trade Row.
3. Bases/Outposts.
4. Effets standards.
5. Ally abilities.
6. Cartes complexes.
7. UI mobile-first.

## Limites connues

Voir `docs/KNOWN_UNCERTAINTIES.md`.
