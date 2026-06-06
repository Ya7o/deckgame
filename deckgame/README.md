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
│   │   └── validators.ts     # State invariant checks
│   ├── ui/                   # React components
│   └── tests/
│       └── engine.test.ts    # 69 unit tests
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
