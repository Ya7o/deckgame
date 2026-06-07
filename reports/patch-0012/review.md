# PATCH 0012 — Durcir le mode solo et nettoyer la traçabilité

## Objectif
Sécuriser le mode solo côté interactions utilisateur, corriger la traçabilité des rapports
existants (hashes de commit manquants, décompte de tests), et mettre à jour le workflow CI/CD
pour réduire la dette Node 20 → Node 22.

---

## 1. Analyse des interactions pendant le tour bot

### Fenêtre de risque

Après l'appel `endTurn(state, "player_1")`, l'état passe à `currentPlayerId === "player_2"`.
Le hook `useEffect` dans `GameBoard` déclenche `runBotTurn` après **600 ms de délai**.

Pendant ces 600 ms, les interactions suivantes étaient théoriquement possibles (avant PATCH 0011) :

| Interaction | Zone | Risque avant PATCH 0011 | État après PATCH 0011 |
|---|---|---|---|
| Click sur carte en main | `dispatch(playCard(...))` | Jouait une carte au nom du bot (player_2) | Bloqué par `!isBotTurn` |
| Click sur rangée commerciale | `dispatch(buyTradeRowCard(...))` | Achetait au nom du bot | Bloqué par `!isBotTurn` |
| Click sur Explorateur | `dispatch(buyExplorer(...))` | Achetait au nom du bot | Bloqué par `!isBotTurn` |
| Click sur base adverse | `dispatch(attackBase(...))` | Attaquait au nom du bot | Bloqué par `!isBotTurn` |
| Click sur base propre | `dispatch(activateBase(...))` | Activait au nom du bot | Bloqué par `!isBotTurn` |
| Bouton "Fin du tour" | `dispatch(endTurn(...))` | Terminait le tour bot immédiatement | `disabled={isBotTurn}` |
| Bouton "Abandonner" | `dispatch(concedeGame(...))` | Intentionnel : reste accessible | Inchangé (voulu) |
| Bouton "Journal" | `setShowLog(...)` | Lecture seule, sans risque | Inchangé |
| `PendingChoicePanel` | `dispatch(resolvePendingChoice(...))` | Non visible pendant le délai (aucun choix player_2 en début de tour) | Inchangé |

### Garantie moteur (couche profonde)

Le moteur refuse toute action d'un joueur dont ce n'est pas le tour via l'erreur
`"not_your_turn"` (validée dans `guardTurn`). Même si l'UI échoue à bloquer une interaction,
le moteur la rejette et retourne **le state de référence inchangé**.

**5 nouveaux tests** dans `bot.test.ts` (PATCH 0012) prouvent cette garantie :
- `playCard` par player_1 → `not_your_turn`
- `attackOpponent` par player_1 → `not_your_turn`
- `buyTradeRowCard` par player_1 → `not_your_turn`
- `endTurn` par player_1 → `not_your_turn`
- Le bot résout tous ses choix → 0 `pendingChoices` player_2 en fin de tour

---

## 2. Tests ajoutés

Fichier : `deckgame/src/tests/bot.test.ts`

```
describe("verrouillage interactions humaines pendant le tour bot")
  ✓ playCard par player_1 pendant le tour bot retourne not_your_turn
  ✓ attackOpponent par player_1 pendant le tour bot retourne not_your_turn
  ✓ buyTradeRowCard par player_1 pendant le tour bot retourne not_your_turn
  ✓ endTurn par player_1 pendant le tour bot retourne not_your_turn
  ✓ le bot termine toujours son tour sans laisser de choix non resolus pour player_2
```

---

## 3. Correction des rapports (traçabilité)

### Hashes de commit manquants

| Rapport | Hash ajouté |
|---|---|
| `reports/patch-0002/review.md` | `68a6632` |
| `reports/patch-0003/review.md` | `543ce91` |
| `reports/patch-0004/review.md` | `d5c165b` |
| `reports/patch-0005/review.md` | `b254dff` |
| `reports/patch-0006/review.md` | `807c7bd` |
| `reports/patch-0007/review.md` | `aa77adf` |
| `reports/patch-0008/review.md` | `522a0a1` |

### Correction PATCH 0009

Le rapport PATCH 0009 mentionnait 14 tests bot, mais le fichier `bot.test.ts` en contenait
réellement **16** lors du commit `1b84c09` (la table de preuves dans le rapport elle-même
liste 16 entrées). Corrections appliquées :

- `"14 tests de comportement du bot"` → `"16 tests de comportement du bot"`
- `"97 tests passent (69 moteur + 14 i18n + 14 bot)"` → `"99 tests passent (69 moteur + 14 i18n + 16 bot)"`
- `"lint ✅ / 97 tests"` → `"lint ✅ / 99 tests"`

---

## 4. Mise à jour workflow GitHub Actions

Fichier : `.github/workflows/*.yml`

| Changement | Avant | Après |
|---|---|---|
| `node-version` | `20` | `22` |

Node 20 passe en maintenance (fin de vie avril 2026). Node 22 est la LTS courante depuis
octobre 2024. La mise à jour est sans risque : le projet n'utilise aucune API Node 20-spécifique.

Les actions elles-mêmes (`checkout@v4`, `setup-node@v4`, `upload-pages-artifact@v3`,
`deploy-pages@v4`) sont déjà à leurs versions les plus récentes et utilisent Node 20 en
interne — aucune mise à jour de version d'action nécessaire à ce stade.

---

## 5. Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 108 passed (69 moteur + 25 bot + 14 i18n)  [+5 tests verrouillage]
build  : PASS — dist/index.js 261 kB / 75.4 kB gzip
```

---

## 6. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/tests/bot.test.ts` | +5 tests verrouillage interactions humaines tour bot |
| `.github/workflows/*.yml` | `node-version: 20` → `node-version: 22` |
| `reports/patch-0002/review.md` | Hash de commit ajouté |
| `reports/patch-0003/review.md` | Hash de commit ajouté |
| `reports/patch-0004/review.md` | Hash de commit ajouté |
| `reports/patch-0005/review.md` | Hash de commit ajouté |
| `reports/patch-0006/review.md` | Hash de commit ajouté |
| `reports/patch-0007/review.md` | Hash de commit ajouté |
| `reports/patch-0008/review.md` | Hash de commit ajouté |
| `reports/patch-0009/review.md` | Correction décompte tests bot (14 → 16) |
| `reports/patch-0012/review.md` | Ce rapport |

---

## 7. Limites restantes

- **`PendingChoicePanel` non explicitement gardé** par `isBotTurn` : en pratique sans risque
  car il n'y a pas de `pendingChoices` pour player_2 au début de son tour. À documenter et
  éventuellement garder dans un patch suivant si un edge case apparaît.
- **Tests UI React** toujours absents (infrastructure jsdom non configurée).
- **Node 24** n'est pas encore LTS — Node 22 est le bon choix aujourd'hui.
- **Délai bot 600 ms** : le délai est purement cosmétique pour que l'utilisateur voit le tour
  changer. Réduire à 400 ms ou le rendre configurable serait une amélioration mineure.

---

## 8. Recommandations PATCH 0013

1. Configurer `vitest` avec `jsdom` pour les tests de rendu React minimaux.
2. Garder `PendingChoicePanel` explicitement avec une condition `isBotTurn` pour la complétude.
3. Rendre le délai bot configurable via un paramètre ou une constante.
4. Envisager `actions/upload-pages-artifact@v4` et `actions/deploy-pages@v5` quand disponibles.
5. Ajouter un indicateur de progression du tour bot (spinner ou barre).

---

## Hash du commit

5614acc
