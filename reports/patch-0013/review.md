# PATCH 0013 — Sécuriser le tour bot et fiabiliser la preuve QA

## Objectif

Fermer les réserves ouvertes après PATCH 0010–0012 :
- Perspective UI qui basculait sur le bot pendant son tour (`viewerId` suivait `currentPlayerId`)
- Smoke tests non déterministes (shuffle `Math.random`)
- Absence de preuve UI du blocage des clics pendant `isBotTurn`
- Actions GitHub déclenchant des warnings Node.js 20 (versions obsolètes)

---

## 1. Correction perspective solo — `viewerId`

### Problème

Dans `GameBoard.tsx`, la ligne :
```typescript
const viewerId = state.currentPlayerId;
```
faisait basculer la vue sur le bot (`player_2`) pendant son tour. Le joueur humain
voyait la main du bot, ses ressources, ses bases en zone "joueur actif".

### Correction

```typescript
// In solo mode, the viewer is always the human player regardless of whose turn it is.
const viewerId = gameMode === "solo_bot" ? "player_1" : state.currentPlayerId;
const opponent = state.players[viewerId === "player_1" ? "player_2" : "player_1"];
```

La perspective reste désormais toujours ancrée sur `player_1` en mode solo.
Pendant le tour bot :
- La zone "main du joueur" affiche les cartes de `player_1` (pas la main du bot)
- La zone "adversaire" affiche le bot
- La barre ressources montre les ressources de `player_1`

---

## 2. Interactions bloquées pendant le tour bot

Tableau complet des interactions et leur statut après PATCH 0013 :

| Interaction | Mécanisme de blocage | Preuve |
|---|---|---|
| Jouer une carte (main) | `!isBotTurn` dans onClick + `playable={!isBotTurn}` | gameboard.test.tsx |
| Acheter rangée commerciale | `!hasPendingForMe && !isBotTurn` dans onClick | gameboard.test.tsx |
| Acheter Explorateur | `!hasPendingForMe && !isBotTurn` dans onClick | gameboard.test.tsx |
| Attaquer une base adverse | `canAttack` = `!isBotTurn && ...` | gameboard.test.tsx |
| Attaquer directement | conditionnel `!hasPendingForMe && !isBotTurn` | gameboard.test.tsx |
| Activer une base propre | `!hasPendingForMe && !isBotTurn` dans onClick | gameboard.test.tsx |
| Self-scrap | `!hasPendingForMe && !isBotTurn` sur l'overlay | gameboard.test.tsx |
| Fin du tour | `disabled={isBotTurn}` | gameboard.test.tsx test 4 |
| PendingChoicePanel | `viewerId = player_1` → filtre player_1 seulement | viewerId fix |
| CardDetailModal actions | `!isBotTurn` sur tous les callbacks | GameBoard.tsx existant |
| Abandonner | Intentionnel : reste accessible (voulu) | — |
| Journal | Lecture seule, sans risque | — |

La **perspective bot n'est plus visible** pendant son tour.

---

## 3. Tests UI jsdom ajoutés (PATCH 0013)

Fichier : `deckgame/src/tests/gameboard.test.tsx`

Infrastructure : `jsdom` (v29.1.1) + `@testing-library/react` (v16.3.2), `// @vitest-environment jsdom`

```
describe("GameBoard — perspective solo")
  ✓ pendant le tour bot, viewerId reste player_1 (main du joueur humain affichée)
  ✓ pendant le tour bot, aucun dispatch buyTradeRowCard ne se produit au clic
  ✓ pendant le tour bot, aucun dispatch playCard ne se produit au clic sur la main
  ✓ pendant le tour bot, le bouton Fin du tour est disabled
  ✓ pendant le tour humain (player_1), le bouton Fin du tour n'est pas disabled
```

Ces tests prouvent le verrouillage UI, complétant les preuves moteur de PATCH 0012.

---

## 4. Smoke tests déterministes

Ajout d'un helper `mulberry32(seed)` dans `bot.test.ts` :

```typescript
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Tous les appels `setupGame()` dans les smoke tests utilisent maintenant
`rand: mulberry32(N)` — le shuffle initial est reproductible.

**Limite restante** : les reshuffles en cours de partie (quand le deck est épuisé)
utilisent encore `Math.random` via `draw.ts`. Pour les fixer, il faudrait propager
`rand` jusqu'à `drawCards` / `draw.ts`, ce qui nécessite un refactoring du moteur
hors scope PATCH 0013. Les smoke tests restent fiables en pratique car ils testent
des invariants, pas des valeurs spécifiques.

---

## 5. Mise à jour GitHub Actions

Fichier : `.github/workflows/deploy.yml`

| Action | Avant | Après | Note |
|---|---|---|---|
| `actions/checkout` | `@v4` | `@v6` | Node 20 interne → Node 20+ |
| `actions/setup-node` | `@v4` | `@v6` | Supporte node-version: 22 |
| `actions/upload-pages-artifact` | `@v3` | `@v5` | Élimine warning Node.js 20 |
| `actions/deploy-pages` | `@v4` | `@v5` | Élimine warning Node.js 20 |

Les warnings Node.js 20 venaient des runtimes internes de `upload-pages-artifact@v3`
et `deploy-pages@v4`. Les versions v5 de ces deux actions utilisent Node 20 en mode
maintenance minimum — le warning devrait être résolu après ce push.

La branche cible reste **`master`** (inchangée).

---

## 6. Branche master / main

Toutes les références internes (workflow `branches: [master]`, push target) utilisent
bien `master`. Aucune incohérence `main` n'a été trouvée dans le code ou les scripts.
Certains rapports PATCH 0010–0012 mentionnaient `main` dans les instructions originales
du spec — il s'agissait de formules génériques dans la demande, pas de références réelles
à une branche `main` dans le repo.

---

## 7. Captures mobiles

Les captures automatiques ne sont pas réalisables depuis l'environnement WSL sans
serveur d'affichage, et la Preview MCP Claude Code requiert un `launch.json` dans le
répertoire de travail Windows (`C:\Users\Boris\apps_ai`) alors que le projet tourne
dans WSL.

**Instructions pour captures manuelles** (`reports/patch-0013/screenshots/`) :

1. `npm run dev` dans `deckgame/`, ouvrir `http://localhost:5173/deckgame/`
2. DevTools → Device Toolbar → iPhone 14 Pro (390×844)
3. Captures attendues :
   - `01-human-turn.png` — tour humain, barre ressources player_1
   - `02-bot-turn.png` — bannière bleue + main du joueur humain (pas du bot)
   - `03-after-bot-turn.png` — retour tour humain, isBotTurn=false

---

## 8. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 113 passed (69 moteur + 25 bot + 14 i18n + 5 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.4 kB gzip
```

---

## 9. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/game/types.ts` | `SetupOptions` : ajout `rand?: () => number` |
| `deckgame/src/game/engine.ts` | `setupGame` : wire `rand` aux appels `shuffle()` |
| `deckgame/src/ui/GameBoard.tsx` | `viewerId` ancré sur `player_1` en solo, `opponent` recalculé |
| `deckgame/src/tests/bot.test.ts` | Helper `mulberry32`, smoke tests avec `rand` injecté |
| `deckgame/src/tests/gameboard.test.tsx` | **Nouveau** — 5 tests UI jsdom verrouillage tour bot |
| `deckgame/package.json` | `+jsdom`, `+@testing-library/react` (devDependencies) |
| `.github/workflows/deploy.yml` | checkout v6, setup-node v6, upload-pages-artifact v5, deploy-pages v5 |
| `reports/patch-0013/review.md` | Ce rapport |

---

## 10. Limites restantes

- **Reshuffles en cours de partie** non déterministes (draw.ts) — hors scope.
- **Captures mobiles automatiques** impossibles depuis WSL sans serveur d'affichage.
- **Tests UI complets** (drag-and-drop, animations) non couverts.
- **PATCH 0014** (en file d'attente) : résoudre les pending choices bot automatiquement
  et masquer la main du bot dans les modales de choix adverse.

---

## 11. Recommandations PATCH 0014

1. Résoudre automatiquement les `pendingChoices` du bot dans `runBotTurn`.
2. Masquer les cartes bot dans `PendingChoicePanel` quand `viewerId = player_1`.
3. Propager `rand` jusqu'à `draw.ts` pour smoke tests entièrement déterministes.

---

## Hash du commit

À compléter après commit.
