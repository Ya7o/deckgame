# Deckgame — Star Realms V0.1

Prototype jouable de Star Realms (set de base) en React + TypeScript.
Support mobile/PWA, layout portrait et paysage, mode solo contre bot.

## Jouer

- **En ligne :** https://ya7o.github.io/deckgame/
- **PWA :** Sur mobile, "Ajouter à l'écran d'accueil" depuis votre navigateur
- **Plein écran :** Bouton disponible sur l'écran d'accueil (Chromium/Android)

## Stack technique

- **Frontend** : React 19 + TypeScript + Vite
- **Tests** : Vitest + Testing Library (274 tests)
- **E2E** : Playwright (multi-viewport, mobile/PWA)
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
  hooks/
    useOrientation.ts    — détection portrait/paysage (matchMedia)
    useFullscreen.ts     — API Fullscreen + WebKit fallback
  ui/
    GameBoard.tsx        — composant principal (portrait + paysage)
    CardView.tsx         — carte individuelle
    PendingChoicePanel.tsx — panneau de choix
    CardDetailModal.tsx  — modal détail / action
    GameLog.tsx          — journal de partie
  i18n/fr.ts             — traductions françaises
  tests/                 — suite de tests (274 tests)
public/
  manifest.webmanifest   — manifest PWA (standalone, orientation: any)
  favicon.svg            — icône SVG
```

## Règles V0 supportées

- Toutes les 52 cartes du set de base (11 factions × effets)
- Effets alliés et effets de récupération (scrap)
- Mode solo (humain vs bot) et 2 joueurs local
- 4 profils de bot avec stratégies d'achat différentes
- Simulation batch pour tests d'équilibrage

## Particularités V0

- P1 pioche 3 cartes au tour 1 (règle de compensation intentionnelle, cf. PATCH 0024)
- Pile Explorateur initialisée à 16 instances (limite pratique V0)
- Reshuffles déterministes si `rand` fourni à `setupGame`

## Documentation utilisateur

- [Guide utilisateur V0.1](docs/user-guide-v0.1.md)
- [Guide mobile & PWA](docs/mobile-pwa-guide.md)

## Historique des patchs

- PATCH 0001–0030 : implémentation moteur, UI, release V0 (tag v0.0.0)
- PATCH 0031–0039 : layout paysage, modal carte, UX compact
- PATCH 0040–0044 : layout paysage robuste, viewport contraint
- PATCH 0045 : PWA (manifest, fullscreen, 100dvh)
- PATCH 0046 : audit multi-viewport (rapport P0/P1/P2/P3)
- PATCH 0047 : journal portrait close button + fullscreen style
- PATCH 0048 : touch targets ≥ 44px, aria-labels
- PATCH 0049 : documentation V0.1
- PATCH 0050 : tag v0.1.0 (à venir)
