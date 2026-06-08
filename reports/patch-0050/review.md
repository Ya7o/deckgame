# PATCH 0050 — Tag V0.1.0

**Date :** 2026-06-08
**Commit :** 793ee42
**Tag :** `v0.1.0`
**Branche :** master
**Tests :** 274 / 274 GREEN

---

## Vérifications pré-tag

| Critère | Résultat |
|---|---|
| `npm run check` (274 tests + build) | ✅ GREEN |
| PATCH 0046 Playwright 25/25 | ✅ GREEN |
| PATCH 0047 Playwright 8/8 | ✅ GREEN |
| PATCH 0048 Playwright 9/9 | ✅ GREEN |
| Problèmes P0 | ✅ Aucun |
| Problèmes P1 | ✅ Résolus |
| Correctifs P2 appliqués (P2-01, P2-03) | ✅ |
| README à jour | ✅ |
| docs/ créés | ✅ user-guide-v0.1.md, mobile-pwa-guide.md |
| docs/v0.1-release-notes.md | ✅ Créé |
| Gameplay inchangé depuis V0.0.0 | ✅ Confirmé |

---

## Fichiers de ce patch

| Fichier | Action |
|---|---|
| `docs/v0.1-release-notes.md` | Nouveau — notes de version V0.1 |
| `reports/patch-0050/review.md` | Nouveau — ce rapport |

---

## Tag créé

```
git tag -a v0.1.0 -m "Deckgame V0.1 — Mobile/PWA release"
```

---

## Séquence 0046–0050 — Récapitulatif

| Patch | Description | Tests | Playwright |
|---|---|---|---|
| 0046 | Audit multi-viewport | 264 ✅ | 25/25 ✅ |
| 0047 | Journal × + fullscreen style | 268 ✅ | 8/8 ✅ |
| 0048 | Touch targets + aria-labels | 274 ✅ | 9/9 ✅ |
| 0049 | Documentation V0.1 | 274 ✅ | — |
| 0050 | Tag v0.1.0 | 274 ✅ | — |

---

## Statut final

**DECKGAME V0.1.0 — RELEASE VALIDÉE**

Application jouable sur mobile (portrait + paysage), installable en PWA,
touch-friendly, documentée.
