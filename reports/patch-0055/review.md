# PATCH 0055 — Clarifier bases, avant-postes et activation

**Date :** 2026-06-09
**Branche :** master
**Tests unitaires :** 298 / 298 GREEN
**Playwright :** 5 / 5 GREEN

---

## Objectif

Rendre les bases et avant-postes plus lisibles : état d'activation, rôle des avant-postes,
messages de blocage d'attaque plus pédagogiques.

---

## Modifications apportées

### A. `deckgame/src/i18n/fr.ts`

Nouveaux champs `fr.ui` :
```ts
baseHint: "Reste en jeu entre les tours.",
baseActivateHint: "Peut être activée ce tour.",
baseUsedHint: "Activée ce tour — disponible au prochain tour.",
outpostHint: "Avant-poste : protège l'adversaire. Doit être détruit avant toute attaque directe.",
outpostBlockLandscape: "🛡 Avant-poste bloque l'attaque",
outpostBlockPortrait: "🛡 Avant-poste adverse — détruisez-le pour attaquer directement",
```

### B. `deckgame/src/ui/CardDetailModal.tsx`

Section de contexte ajoutée sous le statut de zone, pour toute carte de type "base" :
- **Base non-épuisée** : "Reste en jeu entre les tours. Peut être activée ce tour."
- **Base épuisée** : "Reste en jeu entre les tours." + "Activée ce tour — disponible au prochain tour." (en italique accent)
- **Avant-poste** : "Avant-poste : protège l'adversaire. Doit être détruit avant toute attaque directe." (en rouge danger)

### C. `deckgame/src/ui/GameBoard.tsx`

Messages de blocage d'attaque améliorés :
| Avant | Après |
|---|---|
| Landscape : "🛡 Avant-poste" | "🛡 Avant-poste bloque l'attaque" |
| Portrait : "Avant-poste bloque l'attaque directe" | "🛡 Avant-poste adverse — détruisez-le pour attaquer directement" |

### D. `docs/user-guide-v0.1.md`

Section "Bases et avant-postes" ajoutée entre les types de cartes et les factions :
tableau des 4 situations (base activable, base utilisée, avant-poste, avant-poste attaquable).

---

## Note sur le layout landscape

En landscape, le bouton Activer n'est pas affiché directement sur la carte (zone EN JEU
très compacte). L'utilisateur doit taper sur la base pour ouvrir la CardDetailModal,
où le bouton Activer apparaît si la base est disponible. La CardDetailModal montre désormais
le contexte (base/avant-poste hint) pour guider l'utilisateur.

---

## Tests unitaires ajoutés (6 — total 298)

| Suite | Description | Résultat |
|---|---|---|
| PATCH 0055 A | Avant-poste adverse : badge présent | ✅ |
| PATCH 0055 A | Attaque bloquée : message pédagogique | ✅ |
| PATCH 0055 A | Base non-épuisée : bouton Activer | ✅ |
| PATCH 0055 A | Base épuisée : pas de Activer + UTILISÉ | ✅ |
| PATCH 0055 B | Landscape : base non-épuisée visible, pas UTILISÉ | ✅ |
| PATCH 0055 B | Landscape : avant-poste adverse badge | ✅ |

---

## Playwright 5 / 5

| Test | Viewport | Résultat |
|---|---|---|
| A1 — Portrait : pas de message bloquant au départ | 390×844 | ✅ |
| A2 — Portrait : glossaire définit Avant-poste | 390×844 | ✅ |
| A3 — Portrait : partie fonctionnelle après 2 tours | 390×844 | ✅ |
| B1 — Paysage : démarrage sans avant-poste | 844×390 | ✅ |
| B2 — Paysage : glossaire Avant-poste défini | 844×390 | ✅ |

---

## Sécurité gameplay

- Règles des bases inchangées ✅
- Effets des bases inchangés ✅
- Moteur / cartes / équilibrage inchangés ✅
- Seuls fr.ts, CardDetailModal, GameBoard, doc modifiés ✅

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `deckgame/src/i18n/fr.ts` | 6 nouvelles clés fr.ui (base/outpost hints) |
| `deckgame/src/ui/CardDetailModal.tsx` | Section contexte base/avant-poste |
| `deckgame/src/ui/GameBoard.tsx` | Messages blocage attaque améliorés |
| `deckgame/src/tests/gameboard.test.tsx` | +6 tests PATCH 0055 |
| `deckgame/e2e/patch-0055.spec.ts` | Nouveau — 5 tests Playwright |
| `docs/user-guide-v0.1.md` | Section Bases et avant-postes |
| `reports/patch-0055/review.md` | Nouveau — ce rapport |

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (298 tests + build) | ✅ GREEN |
| Playwright 5 tests | ✅ 5/5 |
| Messages avant-poste pédagogiques | ✅ |
| CardDetailModal base contexte | ✅ |
| UTILISÉ overlay existant préservé | ✅ |
| Gameplay modifié | ✅ Non |
