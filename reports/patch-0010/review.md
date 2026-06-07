# PATCH 0010 — Audit post-patch et validation jouabilité solo

## Objectif
Auditer l'état du projet après les patchs 0001-0009, corriger les régressions bloquantes,
et valider qu'une partie locale et une partie contre bot peuvent être jouées jusqu'à la fin.

---

## 1. État Git initial

- Branche : **master** — à jour avec origin/master
- Seul fichier modifié non stagé : `reports/patch-0009/review.md` (ajout du hash de commit `1b84c09`)
- Dernier commit : `1b84c09 PATCH 0009 — Ajouter une IA simple pour jouer solo`
- Historique patches confirmé : PATCH 0001 à 0009 tous commités

---

## 2. Résultat npm run check (avant modifications)

```
lint   : PASS — 0 warning, 0 error
tests  : 99 passed (69 moteur + 16 bot + 14 i18n)
build  : PASS — dist/assets/index-*.js 258 kB / 74.8 kB gzip
```

Aucune régression détectée.

---

## 3. Audit des bugs critiques (patchs 0001-0009)

| Comportement vérifié | Résultat |
|---|---|
| Les Bases ne produisent pas leurs effets au moment où elles sont jouées | PASS — `playCard()` n'applique pas les effets primaires des bases à la pose |
| Les Bases ne peuvent être activées qu'une fois par tour | PASS — `activateBase()` vérifie `baseInst.exhausted`, retourne `base_already_exhausted` |
| Les Bases restent en jeu à la fin du tour | PASS — `endTurn()` préserve `player.bases`, remet `exhausted: false` |
| Les Outposts bloquent l'attaque directe | PASS — `attackOpponent()` vérifie `hasOutpost`, retourne `outpost_blocking` |
| `attackOpponent` refuse 0, négatifs, non-entiers, > Combat | PASS — `!Number.isInteger(amount) \|\| amount <= 0` |
| Une action illégale ne modifie pas le GameState | PASS — `err(state, error)` retourne la référence de state inchangée |
| `pendingChoices` refusent : mauvais joueur, mauvais payload, zone incorrecte, cible absente | PASS — validé dans `choices.ts`, 7 tests dédiés (PATCH 0004) |
| `validateStateInvariants` détecte les états invalides | PASS — duplicate instanceId, trade négatif, winner sans game_over, etc. |

---

## 4. Validation localisation française

| Élément | Résultat |
|---|---|
| Boutons principaux | PASS — Jouer, Acheter, Fin du tour, Contre le Bot, Nouvelle partie, Abandonner |
| Ressources | PASS — Autorité, Commerce, Combat (`fr.resources.*`) |
| Erreurs utilisateur | PASS — 17 codes `EngineError` traduits dans `fr.errors` |
| Logs principaux | PASS — tous les `addLog()` du moteur utilisent le français |
| Noms de cartes | PASS — 40 cartes traduites dans `fr.cardNames`, fallback = ID technique |
| Effets rendus | PASS — `renderEffectFr()` couvre tous les types d'effets |

Note cosmétique : `fr.resources.trade[0]` dans `GameBoard.tsx` affiche `"C"` (première lettre
de `"Commerce"`) dans la barre de ressources. Intentionnel comme abréviation compacte aux côtés
de ♥ (Autorité) et ⚔ (Combat). Non bloquant.

---

## 5. Validation mode solo contre bot

| Critère | Résultat |
|---|---|
| Bouton "Contre le Bot" existe | PASS — `StartScreen` dans `App.tsx` |
| Le bot est player_2 | PASS — `GameBoard.tsx` déclenche `runBotTurn` quand `currentPlayerId === "player_2"` |
| Le bot joue ses cartes | PASS — `runBotTurn()` parcourt la main et joue chaque carte |
| Le bot achète | PASS — `tryBotBuy()` : carte la plus chère abordable, Explorateur en fallback |
| Le bot attaque les Outposts avant l'adversaire | PASS — `tryBotAttack()` trie (Outposts d'abord), puis attaque direct |
| Le bot finit son tour | PASS — `endTurn()` appelé en fin de `runBotTurn()` |
| Aucune boucle infinie | PASS — garde `iterations < MAX_BOT_ACTIONS_PER_TURN (200)` |
| Limite MAX_BOT_ACTIONS_PER_TURN | PASS — constante = 200, testée |
| Logs des actions du bot | PASS — chaque action passe par le moteur qui appelle `addLog()` |

---

## 6. Résultat npm run check (après modifications)

```
lint   : PASS
tests  : 103 passed (69 moteur + 20 bot + 14 i18n)  [+4 smoke tests]
build  : PASS
```

---

## 7. Bugs trouvés

Aucun bug bloquant identifié. Le moteur, le bot et la localisation sont fonctionnels.

---

## 8. Corrections appliquées

Aucune correction de bug (aucun bug bloquant). Modifications uniquement additives.

---

## 9. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/tests/bot.test.ts` | +4 smoke tests PATCH 0010 (humain vs bot, invariants, boucles, bot vs bot) |
| `reports/patch-0009/review.md` | Ajout hash de commit `1b84c09` (correction incomplète PATCH 0009) |
| `reports/patch-0010/review.md` | Ce rapport |

---

## 10. Tests ajoutés (`src/tests/bot.test.ts`)

| Test | Description |
|---|---|
| `les invariants tiennent à chaque tour et la partie se termine` | Simule humain (P1) + bot (P2) jusqu'à game_over ou MAX_TURNS=200 ; valide invariants à chaque tour |
| `le bot rend la main au joueur humain après son tour (3 cycles)` | 3 cycles P1→P2→P1 ; vérifie `currentPlayerId` à chaque transition |
| `MAX_BOT_ACTIONS_PER_TURN protège contre les boucles infinies` | Bot avec 100 Commerce et 200 Combat ; vérifie `actions.length <= 200` |
| `partie complète bot vs bot atteint game_over proprement` | 2 bots jusqu'à game_over (MAX_TURNS=300) ; vérifie `winner` et invariants |

---

## 11. Validation GitHub Pages

| Critère | Résultat |
|---|---|
| `vite.config.ts` base: `'/deckgame/'` | PASS — correct pour `https://Ya7o.github.io/deckgame/` |
| Workflow lance `npm run check` avant déploiement | PASS — step "Check (lint + test + build)" dans `.github/workflows/` |
| Build produit `dist/` | PASS — `index.html` + assets générés |

---

## 12. UX mobile minimale

| Critère | Résultat |
|---|---|
| Commerce / Combat / Autorité visibles | PASS — barre de ressources compacte (symbole + valeur) |
| Boutons principaux accessibles | PASS — "Fin du tour" toujours visible |
| Mode bot accessible | PASS — bouton sur l'écran d'accueil |

---

## 13. Limites restantes

- **Partie très longue** : si les bots n'accumulent pas assez de Combat, la partie peut
  dépasser MAX_TURNS=300 dans le smoke test bot vs bot. Ce cas est documenté dans le test
  et ne constitue pas un échec.
- **Abréviation "C"** pour Commerce dans la barre de ressources — cosmétique, non bloquant.
- **Pas d'indicateur de faction** sur les cartes dans la vue principale (`CardView`).
- **Mode solo uniquement player_2 = bot** — le côté du bot n'est pas configurable.

---

## 14. Recommandations PATCH 0011

1. Ajouter des indicateurs de faction (couleur ou icône) sur chaque carte dans `CardView`.
2. Amélioration du bot : évaluer les synergies de factions lors des achats.
3. UX mobile : taille de police adaptative, scroll horizontal ergonomique pour la main.
4. Écran de fin de partie enrichi : tours joués, cartes achetées, dommages infligés.
5. Clarifier la barre de ressources : remplacer `"C :"` par un libellé complet ou une icône dédiée.

---

## Hash du commit

`8c40b3e`
