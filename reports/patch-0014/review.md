# PATCH 0014 — Séparer zoom carte et achat mobile

## Objectif

Corriger le comportement de la rangée commerciale sur mobile :
avant ce patch, toucher une carte achetable l'achetait immédiatement, sans possibilité
de lire la carte. Le joueur ne pouvait consulter que les cartes non achetables.

---

## 1. Problème corrigé

### Avant PATCH 0014

```tsx
onClick={() => {
  if (canBuy && !hasPendingForMe && !isBotTurn)
    dispatch(buyTradeRowCard(state, viewerId, card.instanceId)); // achat immédiat
  else
    handleCardClick(card); // zoom uniquement si pas achetable
}}
```

| Situation | Clic sur carte rangée commerciale |
|---|---|
| Carte achetable (commerce suffisant) | **Achat direct, sans zoom** |
| Carte non achetable | Zoom (modal détail) |
| Pendant le tour bot | Zoom (isBotTurn bloquait l'achat) |

### Après PATCH 0014

```tsx
// Carte
onClick={() => handleCardClick(card)}  // toujours le zoom

// Bouton ACHAT (overlay séparé)
<button onClick={(e) => { e.stopPropagation(); dispatch(buyTradeRowCard(...)); }}>
  ACHAT
</button>
```

| Situation | Clic sur carte | Clic sur bouton ACHAT |
|---|---|---|
| Carte achetable | Zoom (modal détail) | Achat |
| Carte non achetable | Zoom | Bouton non affiché |
| Pendant le tour bot | Zoom | Bouton non affiché (`!isBotTurn`) |
| Avec choix en attente | Zoom | Bouton non affiché (`!hasPendingForMe`) |

---

## 2. Zones modifiées

### Rangée commerciale (GameBoard.tsx)

- `CardView onClick` → toujours `handleCardClick(card)`
- Badge ACHAT `<div>` → `<button>` avec `onClick={(e) => { e.stopPropagation(); dispatch(...) }}`
- Le bouton est conditionnel : `{canBuy && !hasPendingForMe && !isBotTurn && (...)}`

### Pile Explorateurs (GameBoard.tsx)

Même correction :
- Div principal → `onClick={() => handleCardClick(state.explorerPile[0])}` + `cursor: "pointer"` toujours
- Badge ACHAT → `<button>` séparé conditionnel

L'Explorateur peut désormais être consulté dans la modal détail, y compris quand
le commerce est insuffisant. Le bouton **Acheter** de la modal est alimenté via
le nouveau cas Explorer dans `onBuy`.

### CardDetailModal onBuy (GameBoard.tsx)

Ajout du cas Explorer :
```tsx
onBuy={
  state.tradeRow.includes(selected) && !hasPendingForMe && !isBotTurn
    ? () => { dispatch(buyTradeRowCard(...))); setSelected(null); }
    : state.explorerPile.includes(selected) && player.currentTrade >= 2 && ...
    ? () => { dispatch(buyExplorer(...))); setSelected(null); }
    : undefined
}
```

La modal se ferme automatiquement après un achat (`setSelected(null)`).

---

## 3. Comportement de la main (inchangé, documenté)

Le clic sur une carte en main **joue directement la carte** si `!hasPendingForMe && !isBotTurn`.
Ce comportement est conservé car :
- La main est déjà connue du joueur (ses propres cartes)
- Le zoom est disponible via la modal si le jeu est bloqué (hasPendingForMe)
- L'ajout d'un bouton "JOUER" séparé pour la main est laissé à un patch futur

---

## 4. Tests UI jsdom ajoutés (PATCH 0014)

Fichier : `deckgame/src/tests/gameboard.test.tsx` (extension du describe PATCH 0014)

```
describe("GameBoard — séparation zoom et achat (PATCH 0014)")
  ✓ clic sur carte achetable n'achète pas directement — buyTradeRowCard n'est pas appelé
  ✓ clic sur bouton ACHAT d'une carte achète la carte
  ✓ pendant le tour bot, le bouton ACHAT n'est pas affiché
  ✓ clic sur Explorateur n'achète pas directement — buyExplorer n'est pas appelé
```

---

## 5. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 117 passed (69 moteur + 25 bot + 14 i18n + 9 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

---

## 6. Réponses aux questions du rapport

| Question | Réponse |
|---|---|
| Un tap sur la carte achète encore directement ? | **Non** — le tap ouvre toujours la modal |
| Où l'achat explicite est-il possible ? | Bouton ACHAT overlay sur la carte · Bouton Acheter dans la modal |
| Comportement identique desktop/mobile ? | **Oui** — même handler clic, pas de long-press |
| Explorateur consultable sans achat ? | **Oui** — click ouvre la modal détail |

---

## 7. Captures mobiles

Captures automatiques non disponibles (WSL sans serveur d'affichage).

**Instructions pour captures manuelles** (`reports/patch-0014/screenshots/`) :

1. `npm run dev` dans `deckgame/`, ouvrir `http://localhost:5173/deckgame/`
2. DevTools → Device Toolbar → iPhone 14 Pro (390×844)
3. Captures attendues :
   - `01-trade-row-achat-button.png` — rangée commerciale avec bouton ACHAT séparé
   - `02-card-detail-modal.png` — modal détail avec bouton Acheter en bas
   - `03-explorer-modal.png` — modal détail de l'Explorateur

---

## 8. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Rangée commerciale, Explorateurs, onBuy modal |
| `deckgame/src/tests/gameboard.test.tsx` | +4 tests séparation zoom/achat |
| `reports/patch-0014/review.md` | Ce rapport |

---

## 9. Limites restantes

- **Main du joueur** : clic = jouer directement (pas de zoom avant jeu) — acceptable car les cartes en main appartiennent au joueur.
- **Long-press pour zoom** non implémenté (fragile, hors scope).
- **Captures automatiques** non disponibles depuis WSL.

---

## 10. Recommandations PATCH 0015

1. Ajouter zoom-avant-jouer pour les cartes en main (bouton JOUER dans la modal).
2. Ajouter `data-testid` aux éléments clés de l'UI pour des tests jsdom plus robustes.
3. Propager `rand` jusqu'à `draw.ts` pour smoke tests entièrement déterministes.

---

## Hash du commit

e728696
