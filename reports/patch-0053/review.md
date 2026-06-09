# PATCH 0053 — Rendre les actions du bot visibles hors journal

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests unitaires :** 286 / 286 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Afficher un résumé des actions du bot après son tour, visible directement dans l'UI
sans ouvrir le journal.

---

## Modifications apportées (GameBoard.tsx)

### Calcul du résumé bot (`lastBotActions`)

```tsx
const lastBotActions: string[] = (() => {
  if (gameMode !== "solo_bot") return [];
  if (state.currentPlayerId !== "player_1") return [];
  const botTurn = state.turnNumber - 1;
  if (botTurn < 1) return [];
  return state.log
    .filter(e => e.playerId === "player_2" && e.turn === botTurn)
    .map(e => e.message)
    .filter(m => m !== "Fin du tour." && m !== "Pioche pour le prochain tour.");
})();
```

Calcul pur depuis l'état — aucun état supplémentaire, aucune mutation.
S'efface automatiquement quand le tour bot recommence (currentPlayerId = player_2).

### Formatage des messages (`formatBotAction`)

| Log original | Affiché |
|---|---|
| `Joue Vaisseau Fédéral.` | `Bot joue Vaisseau Fédéral` |
| `Achète Explorateur.` | `Bot achète Explorateur` |
| `Attaque Bot pour 5 dégât(s).` | `Bot attaque Bot pour 5 dégât(s)` |
| `Détruit Base Stellaire.` | `Bot détruit Base Stellaire` |
| `Active Base.` | `Bot active Base` |

### Zone d'affichage — Landscape

Barre compacte entre la zone adversaire et la rangée commerciale :
- Background `#16152a`, bordure inférieure accent
- Icône `✦` + liste des actions séparées par ` · `
- `overflow: hidden; whiteSpace: nowrap; textOverflow: ellipsis`
- Visible uniquement pendant le tour humain (après que le bot a joué)

### Zone d'affichage — Portrait

Barre compacte au-dessus de la section journal (en bas de la zone de jeu),
même style que la version paysage. Non intrusive car positionnée sous les actions.

---

## Ce qui n'est PAS affiché

- La main du bot (jamais exposée) ✅
- Les entrées "Fin du tour." et "Pioche pour le prochain tour." (inutiles) ✅
- Les actions du joueur humain ✅

---

## Tests unitaires ajoutés (6 — total 286)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0053 A | Pas de résumé au 1er tour | ✅ |
| PATCH 0053 A | Journal disponible (portrait) | ✅ |
| PATCH 0053 A | Main bot non exposée | ✅ |
| PATCH 0053 A | Fin du tour désactivé pendant tour bot | ✅ |
| PATCH 0053 B | Pas de résumé au 1er tour (landscape) | ✅ |
| PATCH 0053 B | Journal disponible (landscape) | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Journal disponible pendant partie | 844×390 | ✅ |
| A2 — Main bot non exposée pendant tour bot | 844×390 | ✅ |
| A3 — Résumé bot visible après tour bot | 844×390 | ✅ |
| B1 — Journal disponible portrait | 390×844 | ✅ |
| B2 — Résumé bot + journal après tour bot | 390×844 | ✅ |

---

## Sécurité gameplay

- IA du bot inchangée ✅
- Moteur / règles / cartes inchangés ✅
- Main du bot non exposée ✅
- Seuls des messages de log existants sont formatés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | lastBotActions, formatBotAction, zones résumé |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0053 |
| `deckgame/e2e/patch-0053.spec.ts` | Nouveau — 5 tests Playwright |
| `reports/patch-0053/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (286 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| Actions bot visibles hors journal | ✅ |
| Main bot non exposée | ✅ |
| Journal disponible | ✅ |
| Gameplay modifié | ✅ Non |
