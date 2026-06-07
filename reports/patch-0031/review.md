# PATCH 0031 — Nettoyage post-tag V0

## Objectif

Corriger les incohérences documentaires laissées après le tag v0.0.0 :
hashes manquants dans les rapports, rapport absent pour le patch skipped,
erreurs dans le README et les notes de version.

---

## 1. Hashes renseignés

| Rapport | Hash |
|---|---|
| reports/patch-0025/review.md | a2bbf7d |
| reports/patch-0026/review.md | b8d3329 |
| reports/patch-0027/review.md | ea9a9c0 |
| reports/patch-0028/review.md | 9ee53c1 |

Les quatre rapports contenaient le placeholder "A remplir après git push"
depuis leur création. Remplacé par le hash court du commit correspondant.

---

## 2. Rapport PATCH 0029 créé

`reports/patch-0029/review.md` créé (répertoire était absent).

Contenu : décision de skip, justification RC GREEN (0 erreur, 0 violation,
WinRate 51,5 %, tous profils OK), référence à PATCH 0028.

---

## 3. README corrigé

| Erreur | Avant | Après |
|---|---|---|
| Version React | React 18 | React 19 |
| Statut PATCH 0028 | (prévu) | (terminé) |
| Entrées manquantes | — | PATCH 0029 + 0030 ajoutés |
| Tag absent | — | Section "Version stable" v0.0.0 ajoutée |

---

## 4. docs/v0-release-notes.md corrigé

| Erreur | Avant | Après |
|---|---|---|
| Description PATCH 0017 | Cartes avancées (Fleet HQ, Aiguille Furtive…) | QA mobile automatisée (Playwright prévu, substitution Preview MCP) |

PATCH 0017 n'avait pas introduit les cartes avancées (c'était PATCH 0018+)
mais une tentative de QA mobile automatisée.

---

## 5. Résultats

```
Tests    : 190 (inchangé)
Lint     : 0 erreur
Build    : OK
TypeScript : 0 erreur
```

---

## Hash du commit

- A remplir après git push
