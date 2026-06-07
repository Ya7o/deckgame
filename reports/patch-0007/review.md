# PATCH 0007 — Mettre à jour README et workflow GitHub Pages

## Objectif
Remplacer le README Vite template par une documentation réelle du projet, et bloquer les déploiements GitHub Pages si lint ou tests échouent.

## Corrections apportées

### `deckgame/README.md`
README entièrement réécrit avec :
- Objectif V0 et lien vers GitHub Pages
- Stack avec versions
- Installation et commandes
- Structure du projet
- Description du pipeline CI/CD
- Limites connues V0
- Snippet `validateStateInvariants`

### `.github/workflows/deploy.yml`
Le step `Build` (`npm run build`) a été remplacé par `Check (lint + test + build)` (`npm run check`).

**Avant :**
```yaml
- name: Build
  run: npm run build
```

**Après :**
```yaml
- name: Check (lint + test + build)
  run: npm run check
```

Effet : un push avec un test cassé ou une erreur lint est désormais bloqué en CI et ne déclenche pas de déploiement.

### `vite.config.ts`
Déjà correct — `base: '/deckgame/'` confirmé pour `https://Ya7o.github.io/deckgame/`.

## Tests exécutés
- `npm run check` : lint ✅ / 69 tests ✅ / build ✅

## Hash du commit
`aa77adf`
