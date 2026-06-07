# PATCH 0016 — Sécuriser les actions explicites en modale et en main

## Objectif

Appliquer une règle UX cohérente pour les cartes en main, en miroir de la correction
faite en PATCH 0014 pour la rangée commerciale.

| Zone | Avant | Après |
|---|---|---|
| Rangée commerciale | tap = achat immédiat | tap = zoom · bouton ACHAT = achat _(PATCH 0014)_ |
| Main du joueur | tap = jouer immédiat | tap = zoom · bouton JOUER = jouer _(PATCH 0016)_ |
| Explorateur | tap = achat immédiat | tap = zoom · bouton ACHAT = achat _(PATCH 0014)_ |

---

## 1. Problème corrigé

### Avant PATCH 0016

```tsx
onClick={() => {
  if (!hasPendingForMe && !isBotTurn) dispatch(playCard(state, viewerId, card.instanceId)); // play immédiat
  else handleCardClick(card);
}}
```

Toucher une carte jouable la jouait immédiatement, sans possibilité de lire ses effets.

### Après PATCH 0016

```tsx
// Card tap = always detail
onClick={() => handleCardClick(card)}

// JOUER overlay button = play immediately
<button
  onClick={(e) => { e.stopPropagation(); dispatch(playCard(state, viewerId, card.instanceId)); }}
  style={{ background: "var(--accent)", color: "#fff", ... }}
>JOUER</button>
```

Deux voies d'action pour les cartes en main :
1. **Tap sur la carte** → ouvre la modal de détail (`CardDetailModal`)
2. **Bouton JOUER** (overlay bleu en bas de carte) → joue directement

La modal affiche déjà un bouton "Jouer" (`onPlay` prop), qui ferme aussi la modal après jeu.

---

## 2. Détail des changements

### `GameBoard.tsx`

- Chaque carte en main est maintenant wrappée dans `<div style={{ position: "relative" }}>` (comme les cartes de la rangée commerciale depuis PATCH 0014).
- Le `onClick` de `CardView` appelle toujours `handleCardClick(card)`.
- Un bouton JOUER conditionnel est superposé : `{!hasPendingForMe && !isBotTurn && (<button ...>)}`.
- `onPlay` dans la modal : ajout de `setSelected(null)` après dispatch (la modal se ferme automatiquement après avoir joué depuis la modal, comme `onBuy` depuis PATCH 0014).

### `src/i18n/fr.ts`

Ajout de `playBadge: "JOUER"` dans `ui` (en miroir de `buyBadge: "ACHAT"`).

---

## 3. Comportement par état du jeu

| État | Bouton JOUER visible | Tap carte |
|---|---|---|
| Tour humain, pas de choix en attente | Oui (overlay bleu) | Ouvre modal |
| Tour humain, choix en attente | Non (`hasPendingForMe`) | Ouvre modal |
| Tour bot | Non (`isBotTurn`) | Ouvre modal |
| Phase game_over | N/A | Écran de fin |

---

## 4. Tests ajoutés (PATCH 0016)

Fichier : `deckgame/src/tests/gameboard.test.tsx`

```
describe("PATCH 0016 — actions explicites main / modal")
  ✓ tap sur carte en main ouvre la modal sans dispatcher playCard
  ✓ bouton JOUER sur carte en main dispatch playCard
  ✓ pendant le tour bot, le bouton JOUER n'est pas affiché
```

---

## 5. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 127 passed (69 moteur + 25 bot + 14 i18n + 19 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## 6. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Main : tap = modal, JOUER overlay button, onPlay auto-close |
| `deckgame/src/i18n/fr.ts` | `ui.playBadge: "JOUER"` |
| `deckgame/src/tests/gameboard.test.tsx` | +3 tests actions explicites main |
| `reports/patch-0016/review.md` | Ce rapport |

---

## 7. Limites restantes

- **`onActivate` (bases propres)** non auto-close modal — mineur, pas de confusion UX.
- **Captures mobiles automatiques** toujours non disponibles depuis WSL.
- **QA Playwright** toujours absente — PATCH 0017.

---

## 8. File d'attente

| Patch | Titre |
|---|---|
| **PATCH 0017** | Ajouter une vraie QA mobile automatisée (Playwright) |
| **PATCH 0018** | Audit règles Star Realms / conformité moteur |

---

## Hash du commit

À compléter après commit.
