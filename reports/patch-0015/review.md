# PATCH 0015 — Résoudre automatiquement les choix du bot et masquer sa main

## Objectif

Garantir qu'en mode solo :
- les choix appartenant au bot sont résolus automatiquement, sans intervention du joueur humain ;
- la main du bot n'est jamais affichée au joueur humain ;
- les choix appartenant au joueur humain restent affichés normalement ;
- le bouton Acheter en modal n'apparaît que si le joueur a assez de commerce.

---

## 1. État du mécanisme après PATCH 0013

La majeure partie du problème avait déjà été résolue dans PATCH 0013 :

- `viewerId = gameMode === "solo_bot" ? "player_1" : state.currentPlayerId` — la perspective est
  ancrée sur le joueur humain en mode solo.
- `PendingChoicePanel` filtre `state.pendingChoices.filter(c => c.playerId === viewerId)` — seuls
  les choix de `player_1` sont affichés.
- `runBotTurn` dans `bot.ts` résout automatiquement tous les `pendingChoices` du bot via
  `chooseBotPayload` (implémenté dès l'origine).

PATCH 0015 :
1. Ajoute la **preuve par tests** de ces garanties (tests PATCH 0013 ne couvrent pas l'UI jsdom).
2. Corrige un **bug résiduel** : le bouton Acheter en modal apparaissait même si le joueur n'avait
   pas assez de commerce.
3. Corrige la **numérotation périmée** dans `reports/patch-0013/review.md` (qui recommandait
   PATCH 0014 pour ce sujet, alors que PATCH 0014 a traité la séparation zoom/achat mobile).

---

## 2. Choix bot — types et résolution automatique

### Tous les types de pending choices

| Type | Assigné à | Auto-résolu par le bot ? |
|---|---|---|
| `choose_one` | Joueur actif | Oui (`optionIndex: 0`) |
| `select_cards_to_scrap` | Joueur actif | Oui (skip si optionnel, sinon vide) |
| `select_trade_row_card_to_scrap` | Joueur actif | Oui (carte la moins chère) |
| `select_base_to_destroy` | Joueur actif | Oui (base la plus faible de l'adversaire) |
| `select_cards_to_discard_then_draw` | Joueur actif | Oui (skip si optionnel) |
| `opponent_discard` | **Adversaire** (celui qui subit) | Oui si bot ; humain sinon |
| `select_ship_to_copy` | Joueur actif | Oui (premier candidat) |
| `select_ship_to_acquire_free` | Joueur actif | Oui (carte la plus chère disponible) |

Le choix critique est `opponent_discard` :
- Si le joueur humain joue une carte forçant le bot à défausser → choice pour `player_2` (bot).
  Ce choix n'est pas affiché par `PendingChoicePanel` (filtre `viewerId = player_1`).
  Il est résolu automatiquement par `runBotTurn` lors du prochain tour bot.
- Si le bot joue une carte forçant le joueur humain à défausser → choice pour `player_1` (humain).
  Ce choix EST affiché par `PendingChoicePanel`. Le joueur sélectionne sa propre carte.

### Heuristique de défausse bot (`opponent_discard`)

```typescript
case "opponent_discard": {
  const player = state.players[botPlayerId];
  const amount = choice.amount ?? 1;
  const sorted = [...player.hand].sort(
    (a, b) => (getCardDef(a.definitionId).cost ?? 0) - (getCardDef(b.definitionId).cost ?? 0)
  );
  return { type: "select_cards", cardIds: sorted.slice(0, amount).map(c => c.instanceId) };
}
```

- Défausse en priorité les cartes de coût faible (Éclaireurs, Vipères).
- En cas d'égalité, l'ordre suit le tableau trié — déterministe, sans `Math.random`.

---

## 3. Correction bug modal — bouton Acheter

### Avant PATCH 0015

```typescript
onBuy={
  state.tradeRow.includes(selected) && !hasPendingForMe && !isBotTurn
    ? () => { ... }  // pas de vérification du coût !
    : ...
}
```

La carte était dans la rangée et ce n'était pas le tour bot — mais aucune vérification que
le joueur avait assez de commerce. La modale affichait le bouton Acheter avec `disabled=true`
(vérification dans la modale via `state.currentPlayerId`) mais la prop `onBuy` était toujours
définie, ce qui rendait le bouton visible.

### Après PATCH 0015

```typescript
onBuy={
  state.tradeRow.includes(selected)
    && player.currentTrade >= (getCardDef(selected.definitionId).cost ?? 999)
    && !hasPendingForMe && !isBotTurn
    ? () => { ... }
    : ...
}
```

`onBuy` est `undefined` si le commerce est insuffisant → bouton non rendu.

---

## 4. La main du bot — peut-elle encore apparaître ?

| Scénario | Main bot visible ? |
|---|---|
| Pendant le tour humain, bot a un `opponent_discard` en attente | **Non** — filtré par `viewerId` |
| Pendant le tour bot, modal ouverte sur une base adverse | **Non** — bases visibles, pas la main |
| `PendingChoicePanel` avec choix `opponent_discard` pour `player_2` | **Non** — filtre `viewerId = player_1` |
| N'importe quel scénario normal | **Non** |

**Conclusion : la main du bot n'est jamais affichée au joueur humain.**

---

## 5. Tests ajoutés (PATCH 0015)

Fichier : `deckgame/src/tests/gameboard.test.tsx`

```
describe("PATCH 0015 — choix bot, main bot, modal achat")
  ✓ un choix opponent_discard pour player_2 n'est pas affiché par PendingChoicePanel
  ✓ un choix opponent_discard pour player_1 est bien affiché par PendingChoicePanel
  ✓ le bouton Acheter en modale n'est pas affiché si le commerce est insuffisant
  ✓ le bouton Acheter en modale est affiché si le commerce est suffisant
```

---

## 6. Correction numérotation dans reports/patch-0013/review.md

- Section "10. Limites restantes" : `PATCH 0014` → `PATCH 0015` (avec note que PATCH 0014 a traité la séparation zoom/achat).
- Section "11. Recommandations PATCH 0014" → "Recommandations PATCH 0015".

---

## 7. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 121 passed (69 moteur + 25 bot + 14 i18n + 13 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## 8. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | `onBuy` : ajout vérification `player.currentTrade >= coût` |
| `deckgame/src/tests/gameboard.test.tsx` | +4 tests choix bot / modal achat |
| `reports/patch-0013/review.md` | Numérotation PATCH 0014 → PATCH 0015 corrigée |
| `reports/patch-0015/review.md` | Ce rapport |

---

## 9. Captures mobiles

Captures automatiques non disponibles (WSL sans serveur d'affichage, Preview MCP requiert un projet Windows).

---

## 10. Limites restantes

- **Reshuffles en cours de partie** non déterministes (`draw.ts` — hors scope).
- **Main joueur humain** : clic = jouer directement (pas de zoom avant jeu) — à traiter en PATCH 0016.
- **QA mobile automatisée** absente — à traiter en PATCH 0017.

---

## 11. File d'attente (à ne pas exécuter dans ce patch)

| Patch | Titre | Objectif |
|---|---|---|
| **PATCH 0016** | Sécuriser les actions explicites en modale et en main | Décider et appliquer une règle UX cohérente pour les cartes en main : tap = zoom, puis bouton Jouer = action. |
| **PATCH 0017** | Ajouter une vraie QA mobile automatisée | Playwright ou équivalent : lancer une partie solo, capturer mobile portrait, vérifier boutons critiques, vérifier qu'aucune main bot n'est visible. |
| **PATCH 0018** | Audit règles Star Realms / conformité moteur | Audit des règles : achat, combat, avant-postes, bases, effets alliés, choix, défausse, fin de tour, victoire, nettoyage zones. Ce patch produit un rapport, les corrections deviennent des patchs séparés. |

---

## Hash du commit

f214505
