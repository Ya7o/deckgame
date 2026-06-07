# PATCH 0023 — Geler le périmètre V0 et consolider le backlog de stabilisation

## Objectif

Définir précisément le périmètre de la V0, lister tous les problèmes restants issus
des audits PATCH 0018 à 0022, classer les blocants, et figer le feature freeze.
Aucune modification de code dans ce patch.

---

## 1. Sources consultées

| Rapport | Contenu clé |
|---|---|
| PATCH 0018 | Audit moteur complet — 8 P3, 2 P1, 1 P2 |
| PATCH 0019 | Simulation Bot vs Bot — runner stable, reshuffles non déterministes documentés |
| PATCH 0020 | Baseline 400 parties — P1 winrate 54.8%, 0 erreur |
| PATCH 0021 | 4 profils bot — balanced, aggressive, economy, defensive |
| PATCH 0022 | Correction formule efficiency — aggressive 45%→49.5%, economy 41%→47% |

---

## 2. Résumé du backlog

| Priorité | Nombre | Items |
|---|---|---|
| P0 | 0 | Aucun crash ou corruption d'état |
| P1 | 2 | B-01 (Dreadnaught ally), B-02 (opponent_discard min) |
| P2 | 4 | B-03 (draw-3 doc), B-04 (QA zones), B-05 (batch size), B-06 (UX mobile) |
| P3 | 9 | B-07 à B-15 (dette, CI, docs) |

**Aucun item P0 détecté** : le moteur est stable, aucun crash ni invariant cassé.

---

## 3. Périmètre V0 figé

Voir `docs/v0-scope.md` pour la définition complète.

**Inclus** : moteur de règles principal, mode solo humain vs bot, 4 profils bot,
simulation Bot vs Bot, QA minimale, build de production, UI mobile-first.

**Exclus** : nouvelles cartes, multijoueur, IA avancée, progression, refonte graphique.

---

## 4. Feature freeze confirmé

**Effectif à partir du commit PATCH 0022 — `24bee09`.**

Toute modification après ce point est une correction de bug (P0/P1) ou une tâche
de stabilisation documentée dans les patchs 0024–0030. Aucune fonctionnalité nouvelle
n'est autorisée avant le tag V0.

---

## 5. Plan d'action 0024–0030

| Patch | Type | Titre |
|---|---|---|
| **0024** | code/QA | Corriger Dreadnaught ally + opponent_discard minimum + doc draw-3 |
| **0025** | QA | Durcir couverture tests (zones peu couvertes, batch simulation) |
| **0026** | UX/QA | Stabiliser UX mobile (10 flux, corrections friction) |
| **0027** | doc/dette | Nettoyer dette P3, rapports, README, CI |
| **0028** | QA/doc | Release candidate V0 — validation complète |
| **0029** | code | Corrections RC uniquement si bug bloquant détecté |
| **0030** | doc | Tag V0 + docs/v0-release-notes.md |

---

## 6. Vérifications

```
npm run check : 157 tests passes, lint 0 erreur, build OK
Aucune modification de code dans ce patch.
```

---

## 7. Fichiers créés

| Fichier | Contenu |
|---|---|
| `reports/patch-0023/docs/v0-scope.md` | Périmètre V0 inclus/exclus + critères de sortie |
| `reports/patch-0023/docs/v0-stabilization-backlog.md` | 15 items classés P1-P3 avec détails et mapping patchs |
| `reports/patch-0023/review.md` | Ce rapport |

---

## Hash du commit

- A remplir apres git push
