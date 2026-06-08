# PATCH 0039 — Préparer l'architecture responsive portrait / paysage

**Commit :** à renseigner après push
**Date :** 2026-06-08
**Branche :** master
**Type :** code / QA / doc
**Statut :** GREEN — 216/216 tests · build propre · aucune capture requise

---

## Orientation cible

Ce patch prépare l'infrastructure responsive.
Le portrait reste l'orientation active et non régressée.
Le paysage n'est pas encore implémenté — ce sera PATCH 0040.

---

## Détection d'orientation

**Mécanisme :** `window.matchMedia("(orientation: landscape)")`

- Hook `src/hooks/useOrientation.ts` créé
- Retourne `"portrait"` ou `"landscape"`
- Fallback `"portrait"` si `window.matchMedia` est absent (SSR, jsdom)
- S'abonne aux changements via `MediaQueryList.addEventListener("change", ...)`
- Nettoyage dans le `useEffect` (pas de fuite mémoire)

**Utilisation :** `GameBoard.tsx` appelle `useOrientation()` et expose le résultat
via l'attribut `data-layout` sur le div racine du composant.

---

## Composants préparés

| Composant | Changement |
|---|---|
| `src/hooks/useOrientation.ts` | **NOUVEAU** — hook orientation |
| `src/ui/GameBoard.tsx` | Import hook, `const orientation = useOrientation()`, `data-layout={orientation}` sur root div |
| `src/index.css` | Scaffold CSS landscape : `[data-layout="landscape"]` avec overrides `--card-w: 68px`, `--card-h: 90px` |

---

## CSS responsive scaffold

```css
[data-layout="portrait"] { /* styles portrait restent inline */ }

[data-layout="landscape"] {
  --card-w: 68px;   /* portrait : 80px */
  --card-h: 90px;   /* portrait : 112px */
}
```

Les overrides de taille de cartes sont prêts pour le layout paysage.
Aucun style visuel actif n'a changé pour le portrait.

---

## Pourquoi le portrait n'a pas été supprimé

Le portrait est l'orientation principale validée depuis les audits 0036–0038.
Il reste la seule expérience finalisée et testée. Le layout paysage sera créé
en PATCH 0040 à partir de ce scaffold, sans toucher au portrait.

---

## Ce qui reste à faire pour le paysage

| Étape | Patch |
|---|---|
| Layout plateau paysage : zones bot, marché, EN JEU, main | PATCH 0040 |
| Adaptation modales, journal, actions | PATCH 0041 |
| QA Playwright paysage + décision d'activation | PATCH 0042 |
| Stabilisation post-audit | PATCH 0043 |

---

## Tests

### Vitest — 216/216 GREEN (208 préexistants + 8 nouveaux)

Nouveaux tests PATCH 0039 :
- A. Hook retourne une valeur valide dans jsdom
- B. `data-layout` présent et vaut `"portrait"` ou `"landscape"`
- B. `data-layout` présent pendant tour bot
- C. Sections clés toujours présentes (RANGÉE COMMERCIALE, EN JEU, MAIN, Fin du tour)
- C. Boutons JOUER présents pendant tour humain
- C. Aucune action humaine pendant tour bot
- C. Overflow hidden sur root (structure portrait inchangée)

---

## Confirmation

- ✅ Portrait conservé et non régressé
- ✅ Paysage non implémenté dans ce patch
- ✅ Aucune modification gameplay
- ✅ Aucune modification moteur, règles, cartes, coûts, effets, équilibrage
- ✅ 216/216 tests GREEN
- ✅ Build propre (tsc + vite)
