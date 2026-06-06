# Deckgame V0 — Star Realms Core Set Prototype

Pass-and-play deckbuilder prototype based on Star Realms Core Set rules. Local web app, no backend, no online.

**Play online:** https://Ya7o.github.io/deckgame/

## Stack

| Tool | Version |
|---|---|
| React | 19 |
| TypeScript | 5 |
| Vite | 8 |
| Vitest | 4 |
| ESLint | 9 |

## Installation

```bash
npm ci
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (hot reload) |
| `npm run check` | Lint + tests + build (CI gate) |
| `npm run lint` | ESLint only |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
deckgame/
├── src/
│   ├── data/
│   │   └── cards.ts          # 50 card definitions, Core Set
│   ├── game/
│   │   ├── types.ts          # All TypeScript types
│   │   ├── engine.ts         # 10 public game actions
│   │   ├── effects.ts        # Effect applicators, ally logic
│   │   ├── choices.ts        # Pending choice resolution
│   │   ├── draw.ts           # Draw logic
│   │   ├── utils.ts          # Card movement helpers
│   │   ├── validators.ts     # State invariant checks
│   │   └── bot.ts            # Simple AI bot (solo mode)
│   ├── i18n/                 # French localisation layer
│   ├── ui/                   # React components
│   │   └── gameMode.ts       # GameMode type ("local_2p" | "solo_bot")
│   └── tests/
│       ├── engine.test.ts    # 69 engine unit tests
│       ├── i18n.test.ts      # 14 i18n tests
│       └── bot.test.ts       # 14 bot tests
├── vite.config.ts            # base: '/deckgame/' for GitHub Pages
└── package.json
```

## CI / Deployment

Every push to `master` triggers the GitHub Actions workflow:
1. `npm ci`
2. `npm run check` — lint + tests + build (deploy blocked if any fail)
3. Upload `dist/` and deploy to GitHub Pages

## Langue

La V0 utilise le français comme langue d'affichage par défaut.
Les identifiants techniques et les IDs de cartes restent en anglais pour préserver la stabilité du moteur et des tests.

## Mode solo

L'écran d'accueil propose deux modes :

| Bouton | Description |
|---|---|
| **2 Joueurs** | Passage de la main local, deux joueurs partagent un écran |
| **Contre le Bot** | Jouez contre une IA simple (player_2) |

Le bot (`src/game/bot.ts`) utilise uniquement les actions publiques du moteur et suit ces heuristiques :

1. Résoudre les choix en attente
2. Jouer toutes les cartes de sa main
3. Activer les bases disponibles
4. Acheter la carte abordable la plus coûteuse (ou un Explorateur en secours)
5. Détruire les avant-postes adverses en priorité, puis attaquer directement
6. Fin du tour

`MAX_BOT_ACTIONS_PER_TURN = 200` protège contre les boucles infinies.

**Limites V0** : le bot ignore les récupérations optionnelles (cartes Culte des Machines) et les effets de défausse/pioche optionnels.

## Known limits (V0 scope)

- **Pass-and-play only** — two players share one screen, no networking
- **No persistent state** — game resets on page refresh
- **Stealth Needle ally effects**: copied faction unlocks ally effects correctly; ally *effects of the copied ship* are not re-copied (correct per Star Realms rules)
- **Scrap effects**: not shown as interactive choices yet (passive only)
- **Mobile layout**: not optimised

## Test workflow

```bash
npm run check   # must pass before committing
```

State invariants can be checked programmatically:

```typescript
import { validateStateInvariants } from "./src/game/validators";
const errors = validateStateInvariants(state); // [] = valid
```
