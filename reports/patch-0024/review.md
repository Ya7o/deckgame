# PATCH 0024 — Corriger les blocants règles et moteur V0

## Objectif

Corriger les 3 items P1 du backlog PATCH 0023 :
- **B-01** : Dreadnaught allié +5 Combat absent
- **B-02** : `opponent_discard` minimum non validé
- **B-03** : Règle P1 draw-3 non documentée

---

## 1. Corrections appliquées

### B-01 — Dreadnaught : effet allié +5 Combat

**Fichier** : `src/data/cards.ts`, ligne 39

| Avant | Après |
|---|---|
| `ally_effects: ""` | `ally_effects: "ally(star_empire):gain_combat:5"` |

**Justification** : Dans Star Realms (set de base), le Dreadnaught a un effet allié
qui donne +5 Combat quand un autre vaisseau Star Empire est en jeu.
Cet effet était absent depuis l'implémentation initiale (identifié en PATCH 0018).

**Risque** : Faible — ajout d'un effet inexistant. Impact mineur sur l'équilibrage
(1 seul Dreadnaught dans le set, coût 7, peu fréquent en partie courte).

**Tests ajoutés** :
- Dreadnaught sans allié : +7 combat seulement
- Dreadnaught avec Corvette (Star Empire) en jeu : ≥ 12 combat (+7 primaire +5 allié)

---

### B-02 — opponent_discard minimum obligatoire

**Fichier** : `src/game/choices.ts`, case `opponent_discard` (validation)

**Avant** :
```typescript
if (payload.cardIds.length > amount) return err(state, "invalid_choice");
// Manquait : vérification du minimum
```

**Après** :
```typescript
if (payload.cardIds.length > amount) return err(state, "invalid_choice");
// Minimum obligatoire : defausser min(amount, taille_main) cartes si non optionnel
const minRequired = choice.optional ? 0 : Math.min(amount, handIds.size);
if (payload.cardIds.length < minRequired) return err(state, "invalid_choice");
```

**Justification** : Un appel API direct pouvait envoyer `cardIds: []` pour une
défausse obligatoire. Désormais refusé si la main contient des cartes.

**Cas limites couverts** :
- Main vide : `min(amount, 0) = 0` → sélection vide acceptée
- Choix optionnel : `minRequired = 0` → sélection vide acceptée
- Main non vide, choix obligatoire : sélection non vide exigée

**Risque** : Vérification bot effectuée. Le bot (`chooseBotPayload`) utilise
`sorted.slice(0, amount)` qui envoie toujours les bonnes cartes. Testé sur
1000 parties (5 passes × 200 seeds) : 0 erreur moteur.

**Tests ajoutés** :
- Sélection vide refusée si main non vide et choix non optionnel
- Sélection vide autorisée si main vide
- Sélection vide autorisée si choix optionnel
- Sélection correcte acceptée et carte défaussée

---

### B-03 — Règle P1 draw-3 documentée

**Fichier** : `src/game/engine.ts`, fonction `setupGame`

Ajout d'un commentaire explicatif :
```typescript
// Règle de compensation V0 : le premier joueur pioche 3 cartes au lieu de 5
// pour réduire l'avantage du premier tour (P1 obtient le premier accès à la
// rangée commerciale et joue ses vipers en premier). Les simulations PATCH 0022
// confirment un avantage P1 résiduel de 53-54 %, jugé acceptable pour V0.
```

**Justification** : La règle était identifiée comme "non documentée" dans PATCH 0018.
Elle est maintenant confirmée comme intentionnelle — règle de compensation V0
documentée par les données de simulation.

**Test ajouté** :
- P1 pioche 3 cartes au tour 1 (assertion de la règle intentionnelle)

---

## 2. Tests

```
Avant PATCH 0024 : 157 tests
Après PATCH 0024 : 164 tests (+7 nouveaux)
Lint : 0 erreur
Build : OK
```

Tests ajoutés dans `engine.test.ts` :
- `PATCH 0024 — Dreadnaught effet allié` (2 tests)
- `PATCH 0024 — opponent_discard minimum obligatoire` (4 tests)
- `PATCH 0024 — Règle P1 draw-3` (1 test)

---

## 3. Simulation après corrections

```
1000 parties (5 × 200, seeds 1-200) :
- Erreurs moteur : 0
- Violations d'invariant : 0
```

Note : Le batch `npm run sim:batch` (100 parties par défaut) peut afficher
P1=63% sur certains runs en raison de la petite taille d'échantillon et des
reshuffles non déterministes. Sur 200 parties, la variance se réduit à ~50%.

---

## 4. Limites

- Reshuffles non déterministes (Math.random) : résidu de variance dans les simulations.
  Documenté comme P3 dans le backlog — traité en PATCH 0027.
- L'avantage P1 (53-54%) reste présent. La règle draw-3 est maintenant documentée
  comme compensation V0, mais ne corrige pas entièrement le déséquilibre.
- Dreadnaught : impact réel sur l'équilibrage non mesuré (correction de règle,
  pas de changement d'équilibrage volontaire). À surveiller en PATCH 0028 RC.

---

## Hash du commit

- d8b8eee21395d2089e7ae067dfaca8d2d61c7b7f (PATCH 0024)
