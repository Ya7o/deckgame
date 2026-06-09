# PATCH 0051 — Acter le paysage plein écran comme expérience cible

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests :** 274 / 274 GREEN (inchangé — aucune modification source)

---

## Objectif

Formaliser la décision produit : paysage plein écran = expérience principale pour V0.2.
Portrait conservé, secondaire. Documenter le backlog V0.2 et mettre à jour les guides.

---

## Travail réalisé

### Lecture des rapports 0045–0050

- PATCH 0046 : audit P0/P1/P2/P3 — aucun P0, 1 P1 (résolu en 0047), 5 P2, 4 P3
- PATCH 0047 : journal portrait × + fullscreen style
- PATCH 0048 : touch targets ≥ 44px + aria-labels
- PATCH 0049 : documentation V0.1
- PATCH 0050 : tag v0.1.0

Problèmes ouverts : P2-04 (PNG icons), P2-05 (modal access), P3-01 (bot indicator),
P3-02 (manifest screenshots), P3-03 (portrait empty space).

### Décision produit

Paysage plein écran retenu comme expérience cible V0.2 :
- Meilleure exploitation de la largeur mobile
- Toutes zones visibles simultanément
- Compatible avec la direction PWA standalone (PATCH 0045)

Portrait : supporté, non dégradé, secondaire.

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `docs/product-direction-v0.2.md` | Nouveau — décision, backlog, critères, risques |
| `README.md` | Mis à jour — expérience recommandée, limitations V0.2, backlog |
| `docs/mobile-pwa-guide.md` | Mis à jour — section paysage recommandé, instructions fullscreen |
| `reports/patch-0051/review.md` | Nouveau — ce rapport |

---

## Code modifié

Aucune modification de code fonctionnel.

---

## Tests

274 / 274 GREEN (inchangé).

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (274 tests + build) | ✅ GREEN |
| Direction produit documentée | ✅ |
| README à jour | ✅ |
| Guide mobile/PWA à jour | ✅ |
| Portrait conservé | ✅ |
| Gameplay modifié | ✅ Non |
