# Deckgame — Star Realms V0

Prototype jouable de Star Realms (set de base) en React + TypeScript.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **Tests** : Vitest + Testing Library
- **Moteur de jeu** : pur TypeScript, immuable (pas de mutation d'état)

## Lancer le projet

```bash
cd deckgame
npm install
npm run dev        # serveur de développement
npm run check      # lint + tests + build (pipeline complète)
npm run sim:batch  # simulation 100 parties bot vs bot
```

## Architecture

```
src/
  data/cards.ts          — définitions des 52 cartes (set de base)
  game/
    types.ts             — types (GameState, CardInstance, EngineResult…)
    engine.ts            — fonctions de jeu (playCard, buyTradeRowCard…)
    effects.ts           — résolution des effets
    choices.ts           — résolution des choix pendants
    bot.ts               — bot déterministe
    bot-profile.ts       — 4 profils bot (balanced, aggressive, economy, defensive)
    simulate.ts          — simulation batch
    draw.ts              — pioche + reshuffle
    utils.ts             — utilitaires (shuffle, moveCard…)
  ui/
    GameBoard.tsx        — composant principal
    CardView.tsx         — carte individuelle
    PendingChoicePanel.tsx — panneau de choix
    CardDetailModal.tsx  — modal détail / action
    GameLog.tsx          — journal de partie
  i18n/fr.ts             — traductions françaises
  tests/                 — suite de tests (190+ tests)
```

## Règles V0 supportées

- Toutes les 52 cartes du set de base (11 factions × effets)
- Effets alliés et effets de récupération (scrap)
- Mode solo (humain vs bot) et 2 joueurs local
- 4 profils de bot avec strategies d'achat différentes
- Simulation batch pour tests d'équilibrage

## Particularités V0

- P1 pioche 3 cartes au tour 1 (règle de compensation intentionnelle, cf. PATCH 0024)
- Pile Explorateur initialisée à 16 instances (limite pratique V0)
- Reshuffles déterministes si `rand` fourni à `setupGame`

## Historique des patchs

- PATCH 0001–0022 : implémentation du moteur et de l'UI
- PATCH 0023 : gel du scope V0 + backlog de stabilisation
- PATCH 0024 : corrections moteur P1 (Dreadnaught, opponent_discard, draw-3)
- PATCH 0025 : durcissement QA (190 tests, batch 100 parties)
- PATCH 0026 : stabilisation UX mobile (badge ACTIV., 11 flux vérifiés)
- PATCH 0027 : cleanup V0 (dette B-07–B-15, README)
- PATCH 0028 : release candidate V0 (prévu)
