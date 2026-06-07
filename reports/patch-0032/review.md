# PATCH 0032 — Corriger les frictions UX mobile observées en partie réelle

## Objectif

Améliorer la jouabilité mobile sans changer le gameplay ni le moteur.
Corrections issues d'une vraie partie mobile post-tag V0.

---

## 1. Libellé "EN JEU" corrigé

**Fichier** : `src/i18n/fr.ts`

**Avant** : `inPlay: "EN JEU — Vaisseaux"` — trompeur quand la zone contient aussi des bases.

**Après** : `inPlay: "EN JEU"` — label neutre.

De plus, la section "EN JEU" dans `GameBoard.tsx` a été restructurée :
un séparateur visuel (bande verticale `var(--border)`) est inséré entre les
vaisseaux joués et les bases lorsque les deux groupes sont présents simultanément.
Les badges existants sur les cartes ("Vais.", "Base", "Avant-p.") continuent
d'identifier le type de chaque carte.

---

## 2. Bouton "ACTIV." repositionné

**Fichier** : `src/ui/GameBoard.tsx`

**Avant** : `position: absolute, bottom: 3px` — superposé sur les effets de la carte base.

**Après** : bouton rendu **sous** la carte via un wrapper `flexDirection: column`.
La carte est dans un `<div style={{ position: "relative" }}>` séparé ; le bouton
"ACTIV." est en-dessous avec `width: var(--card-w)`. Il ne masque plus aucun texte.

Comportement inchangé : visible si `!base.exhausted && !hasPendingForMe && !isBotTurn`,
absent pendant le tour bot ou si la base est épuisée.

---

## 3. Main mobile protégée du bas d'écran

**Fichier** : `src/ui/GameBoard.tsx`

**Avant** : la zone HAND avait `padding: "8px"` sans protection safe area.
La ligne de cartes interne avait `paddingBottom: "env(safe-area-inset-bottom, 4px)"`.

**Après** :
- Zone HAND : `paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))"` — la zone
  entière recule au-dessus de la barre navigateur/système mobile.
- Ligne de cartes interne : `paddingBottom: "4px"` (fallback simplifié, safe area gérée par le parent).

---

## 4. Overlay de modale amélioré

**Fichier** : `src/ui/CardDetailModal.tsx`

**Avant** : `background: "rgba(0,0,0,0.72)"` — les boutons "ACHAT" arrière-plan restaient trop visibles.

**Après** : `background: "rgba(0,0,0,0.85)"` — fond nettement plus opaque, neutralise
visuellement les éléments interactifs de l'arrière-plan.

---

## 5. Vérifications d'interactions

Aucune logique de dispatch modifiée. Comportements confirmés inchangés :
- tap carte → ouvre la modale (modal affiche actions disponibles)
- bouton JOUER → playCard
- bouton ACHAT → buyTradeRowCard / buyExplorer
- bouton ACTIV. → activateBase (déplacé mais fonctionnellement identique)
- aucune action pendant le tour bot
- main bot non exposée

---

## 6. Tests

190 tests existants : tous verts. Aucun test cassé par les modifications.
Les 4 tests PATCH 0026 (Flow 7 — ACTIV.) passent : le bouton est toujours
présent/absent dans les mêmes conditions, le click dispatch le même handler.

Pas de nouvelles captures (environnement WSL sans navigateur headless configuré).

---

## 7. Résultats

```
Tests    : 190 (inchangé)
Lint     : 0 erreur
Build    : OK
TypeScript : 0 erreur
```

---

## 8. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/i18n/fr.ts` | `inPlay` : "EN JEU — Vaisseaux" → "EN JEU" |
| `src/ui/GameBoard.tsx` | IN PLAY : séparateur ships/bases, ACTIV. sous carte, HAND safe area |
| `src/ui/CardDetailModal.tsx` | overlay opacity 0.72 → 0.85 |

---

## 9. Confirmation scope

- Aucune règle modifiée.
- Aucune carte modifiée.
- Aucun effet, coût, faction ou équilibrage modifié.
- Aucune nouvelle mécanique.
- Aucune action rendue inaccessible.

---

## Hash du commit

- 233f4e3
