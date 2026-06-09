# PATCH 0058 — Rendre l'activation des bases directe en paysage

**Date :** 2026-06-09
**Commit :** f1b9aae
**Branche :** master
**Tests unitaires :** 310 / 310 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Résoudre le problème P1-1 identifié lors de l'audit PATCH 0057 : en paysage, le bouton
Activer sur les bases n'était accessible que via la modale — pas de raccourci direct sur la
carte dans EN JEU.

---

## Modification apportée

### `deckgame/src/ui/GameBoard.tsx` — section bases du layout paysage

**Avant :** chaque base était rendu dans un simple `div` avec `position: relative` —
aucun bouton Activer visible directement.

**Après :** wrapper `flex-column` identique au portrait, avec bouton Activer (52px, 7px
font, fond `var(--empire)`) conditionné par `canActivateLs`:

```tsx
const canActivateLs = !base.exhausted && !hasPendingForMe && !isBotTurn;
// …
{canActivateLs && (
  <button
    onClick={(e) => { e.stopPropagation(); dispatch(activateBase(state, viewerId, base.instanceId)); }}
    style={{ width: "52px", fontSize: "7px", background: "var(--empire)", color: "#fff",
             padding: "2px 0", borderRadius: "3px", fontWeight: "bold", border: "none",
             cursor: "pointer", minHeight: "auto" }}
  >
    {fr.actions.activateBase}
  </button>
)}
```

**Comportements garantis :**
- Base non-épuisée → bouton Activer affiché directement sous la carte
- Base épuisée → bouton absent, overlay UTILISÉ visible via CardView
- Clic Activer → `dispatch(activateBase(...))` → base passe exhausted = true
- La modale CardDetail reste accessible via tap sur la carte (inchangé)
- Portrait : non modifié (portrait avait déjà ce bouton depuis PATCH 0055)

---

## Tests unitaires ajoutés (5 — total 310)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0058 A | Landscape : base non-épuisée affiche bouton Activer direct | ✅ |
| PATCH 0058 A | Landscape : base épuisée n'affiche pas Activer et montre UTILISÉ | ✅ |
| PATCH 0058 A | Landscape : clic Activer dispatch activateBase | ✅ |
| PATCH 0058 A | Landscape : la modale reste accessible via tap sur la carte | ✅ |
| PATCH 0058 B | Portrait : base non-épuisée affiche encore Activer | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Paysage : démarrage partie sans bases, Fin du tour actif | 844×390 | ✅ |
| A2 — Paysage : après 3 tours, vérifier actions disponibles | 844×390 | ✅ |
| A3 — Paysage : bouton Activer visible si base activable | 844×390 | ✅ |
| B1 — Portrait : layout intact | 390×844 | ✅ |
| B2 — Portrait : journal cycle intact | 390×844 | ✅ |

---

## Sécurité gameplay

- Moteur de règles inchangé ✅
- `activateBase` est une action existante — pas de nouvelle mécanique ✅
- Portrait non régressé ✅
- Cartes / coûts / effets / équilibrage : aucune modification ✅

---

## Problèmes P1 résiduels après PATCH 0058

| # | Description | Statut |
|---|---|---|
| P1-1 | Bouton Activer direct en landscape | ✅ RÉSOLU (ce patch) |
| P1-2 | Résumé bot tronqué silencieusement | ⏳ PATCH 0059 |

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Wrapper flex-column + bouton Activer direct sur bases landscape |
| `deckgame/src/tests/gameboard.test.tsx` | +5 tests PATCH 0058 (total 310) |
| `deckgame/e2e/patch-0058.spec.ts` | Nouveau — 5 tests Playwright |
| `reports/patch-0058/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (310 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| P1-1 résolu | ✅ |
| Portrait non régressé | ✅ |
| Gameplay modifié | ✅ Non |
