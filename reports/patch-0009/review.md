# PATCH 0009 — Ajouter une IA simple pour jouer solo

## Objectif
Permettre au joueur de jouer seul contre un bot local, sans modifier le moteur ni les tests existants.

## Résultat
Mode solo fonctionnel. Le bot joue automatiquement son tour via les actions publiques du moteur. 97 tests passent (69 moteur + 14 i18n + 14 bot).

---

## Architecture

- **`src/game/bot.ts`** — toute la logique du bot, sans état interne.
- **`src/ui/gameMode.ts`** — `GameMode = "local_2p" | "solo_bot"` (UI seulement, hors moteur).
- **`src/App.tsx`** — sélecteur de mode à l'écran d'accueil.
- **`src/ui/GameBoard.tsx`** — `useEffect` déclenche `runBotTurn` après 600 ms quand `currentPlayerId === "player_2"` en mode solo.

Le moteur est inchangé. Le bot est une couche au-dessus des actions publiques.

---

## Fichiers modifiés / créés

### Nouveaux
| Fichier | Contenu |
|---|---|
| `src/game/bot.ts` | `runBotTurn`, `tryBotBuy`, `tryBotAttack`, `chooseBotPayload`, `MAX_BOT_ACTIONS_PER_TURN = 200` |
| `src/ui/gameMode.ts` | `GameMode = "local_2p" \| "solo_bot"` |
| `src/tests/bot.test.ts` | 14 tests de comportement du bot |

### Modifiés
| Fichier | Changements |
|---|---|
| `src/App.tsx` | Mode selector : boutons "2 Joueurs" / "Contre le Bot" ; `GameSession` avec `mode` |
| `src/ui/GameBoard.tsx` | Prop `gameMode`, `useEffect` auto-trigger bot, bannière "Le Bot réfléchit…" |
| `src/i18n/fr.ts` | Ajout `startScreen.mode2p`, `.modeSolo`, `.botName` ; section `bot` |
| `deckgame/README.md` | Section "Mode solo", mise à jour structure projet |

---

## Heuristiques du bot

| Étape | Action |
|---|---|
| 1 | Résoudre tous les choix en attente (son joueur) |
| 2 | Jouer toutes les cartes de sa main |
| 3 | Activer les bases disponibles (non épuisées) |
| 4 | Acheter la carte la plus chère abordable (ou Explorateur) |
| 5 | Détruire avant-postes en priorité, puis attaquer directement |
| 6 | Fin du tour |

### Résolution de choix

| Type | Heuristique |
|---|---|
| `choose_one` | Toujours option 0 |
| `select_cards_to_scrap` | Skip si optionnel ; 0 carte si obligatoire (V0) |
| `select_trade_row_card_to_scrap` | Carte la moins chère (même si optionnel) |
| `select_base_to_destroy` | Base la plus faible (même si optionnel) |
| `select_cards_to_discard_then_draw` | Skip (toujours optionnel dans le Core Set) |
| `opponent_discard` | Défausse ses cartes les moins chères |
| `select_ship_to_copy` | Premier candidat disponible |
| `select_ship_to_acquire_free` | Vaisseau le plus coûteux |

---

## Preuves — 14 tests bot

| Test | Résultat |
|---|---|
| `MAX_BOT_ACTIONS_PER_TURN` vaut 200 | ✅ |
| `runBotTurn` renvoie ok:true sans erreur | ✅ |
| Le bot passe la main à player_1 | ✅ |
| `actions` inclut end_turn | ✅ |
| Le bot joue ses cartes | ✅ |
| Ne fait rien si ce n'est pas son tour | ✅ |
| Ne fait rien si la partie est terminée | ✅ |
| Achète la carte la plus chère abordable | ✅ |
| Achète un Explorateur en secours | ✅ |
| Attaque directement sans avant-poste | ✅ |
| Détruit l'avant-poste avant d'attaquer | ✅ |
| N'attaque pas si l'avant-poste est trop solide | ✅ |
| Résout `choose_one` (option 0) | ✅ |
| Résout `opponent_discard` (carte la moins chère) | ✅ |
| Skip `select_cards_to_scrap` optionnel | ✅ |
| Acquiert le vaisseau le plus cher via `select_ship_to_acquire_free` | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 97 tests ✅ (3 fichiers) / build ✅

## Limites restantes
- Bot ignore les récupérations optionnelles (Culte des Machines) — V0.
- Bot choisit toujours l'option 0 pour `choose_one` sans évaluation.
- Pas de profondeur de recherche (heuristiques gloutonnes uniquement).
- La bannière "Le Bot réfléchit…" apparaît 600 ms avant que le tour s'exécute.

## Hash du commit
À compléter après commit.
