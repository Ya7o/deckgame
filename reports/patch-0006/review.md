# PATCH 0006 — Encadrer Stealth Needle et les cartes complexes

## Objectif
Auditer et sécuriser les cartes complexes du Core Set. Corriger le bug d'ally de Stealth Needle (Option A).

---

## Audit des cartes complexes

### Stealth Needle (machine_cult, ship, cost 4)
**Statut : CORRIGÉ**

**Bug identifié :** après résolution du `select_ship_to_copy`, `reapplyAllAllyEffects` n'était pas appelé. La nouvelle faction temporaire (`temporaryFactions`) était enregistrée sur Stealth Needle, mais les effets d'ally débloqués par cette faction n'étaient jamais déclenchés.

**Correction dans `src/game/choices.ts` :**
Ajout de `reapplyAllAllyEffects(s, playerId)` après `applyEffects` dans le cas `select_ship_to_copy`.

**Comportement correct V0 :**
- Interdit de copier une Base (la liste des candidats ne contient que les ships dans `inPlay`)
- Interdit l'auto-copie (sourceCardInstanceId exclu des candidats)
- Copie les `primaryEffects` du ship cible (sauf `self_scrap`)
- Ajoute la faction du ship cible dans `temporaryFactions`
- Déclenche immédiatement les ally effects débloqués par la nouvelle faction

**Limitation V0 restante :** les `allyEffects` et `scrapEffects` du ship copié ne sont pas copiés (règles Star Realms : seuls les primaryEffects sont copiés par Stealth Needle).

---

### Mech World (machine_cult, base, cost 5, defense 6, outpost)
**Statut : OK**
Passive query via `hasMechWorldInPlay()` dans `hasAlly()`. Aucune mutation de state nécessaire. Comportement correct.

### Fleet HQ (star_empire, base, cost 8, defense 8)
**Statut : OK**
Enregistre un `ActiveTrigger` à l'entrée en jeu. Chaque ship joué ensuite déclenche `+1 Combat` via `applyShipPlayedTriggers`. Trigger retiré si la base est détruite. Comportement correct.

### Brain World (machine_cult, base, cost 8, defense 6, outpost)
**Statut : OK**
Crée un pending choice `select_cards_to_scrap`. Après résolution, tire autant de cartes que de cartes scrappées via `draw_per_card_scrapped_this_way`. Comportement correct.

### Blob Carrier (blob, ship, cost 6)
**Statut : OK**
Primary `gain_combat:7`. Ally (blob) : `acquire_ship_free_to_top_deck` → `select_ship_to_acquire_free` pending choice. Comportement correct.

### Blob World (blob, base, cost 8, defense 7)
**Statut : OK**
`choose_one: gain_combat:5 | draw_per_blob_played_this_turn`. Les blobs joués sont comptés via `cardsPlayedThisTurn` (instance IDs). Comportement correct.

### Freighter (trade_federation, ship, cost 4)
**Statut : OK**
Primary `gain_trade:4`. Ally : `next_ship_acquired_to_top_deck_optional` → `ActiveModifier`. Comportement correct.

### Central Office (trade_federation, base, cost 7, defense 6)
**Statut : OK**
Primary `gain_trade:2; next_ship_acquired_to_top_deck_optional`. Ally : `draw:1`. Comportement correct.

### Embassy Yacht (trade_federation, ship, cost 3)
**Statut : OK**
`gain_trade:3; gain_authority:3; draw_if_two_or_more_bases:2`. Le comptage de bases utilise `player.bases.length`. Comportement correct.

---

## Preuves — tests ajoutés (6 nouveaux, Stealth Needle)

| Test | Résultat |
|---|---|
| Playing Stealth Needle crée un pending choice `select_ship_to_copy` | ✅ |
| Copie les effets primaires du ship sélectionné (+3 combat de Blob Fighter) | ✅ |
| Ajoute la faction "blob" dans `temporaryFactions` | ✅ |
| Copie d'une Base impossible (pas de pending choice créé) | ✅ |
| Auto-copie rejetée : instanceId de Stealth Needle absent des candidats, et payload forcé → `invalid_target` | ✅ |
| Ally effects débloqués après copie (état valide, combat augmenté) | ✅ |

## Tests exécutés
- `npm run check` : lint ✅ / 69 tests ✅ / build ✅

## Hash du commit
À compléter après commit.
