# Direction produit — Deckgame V0.2

**Décision arrêtée :** paysage plein écran = expérience cible principale
**Portrait :** supporté, non supprimé, secondaire
**Date de décision :** 2026-06-08

---

## Décision

L'expérience recommandée pour Deckgame V0.2 est **paysage plein écran sur mobile/PWA**.

Raisons :
- Le layout paysage exploite mieux la largeur d'un téléphone pour afficher simultanément
  la rangée commerciale, la main du joueur et les actions — sans scroll vertical.
- Le mode plein écran supprime les barres de navigation, maximisant l'espace de jeu.
- Les audits V0.1 (PATCH 0046) confirment que le layout paysage est fonctionnel jusqu'à
  740×340px. Le layout portrait est utilisable mais plus contraint.
- La direction PWA retenue depuis PATCH 0045 est optimisée pour le paysage standalone.

---

## Portrait — statut

Le portrait reste supporté et non dégradé. Il est recommandé pour :
- Les appareils ou situations où le paysage n'est pas pratique
- Les navigateurs sans support fullscreen
- Les utilisateurs préférant tenir leur téléphone à la verticale

Aucun patch V0.2 ne supprimera ou ne dégradera le portrait.

---

## Problèmes à traiter en V0.2 (backlog actif)

| ID | Description | Priorité | Patch cible |
|---|---|---|---|
| V02-01 | Actions bot peu lisibles hors journal | P1 | 0053 |
| V02-02 | Vocabulaire flou (Main, Pioche, Défausse, Écarter, Effet allié) | P2 | 0054 |
| V02-03 | Bases et avant-postes — activation peu claire | P2 | 0055 |
| V02-04 | Hiérarchie boutons incohérente | P2 | 0056 |
| V02-05 | Layout paysage non optimisé | P2 | 0052 |
| P2-04 | Icônes PWA PNG absentes | P3 | à planifier |
| P2-05 | Accès modal carte non évident | P2 | à planifier |
| P3-01 | Indicateur visuel tour bot | P3 | 0053 |
| P3-03 | Espace vide portrait accueil | P3 | à planifier |

---

## Critères de réussite V0.2

| Critère | Mesure |
|---|---|
| Partie complète en paysage plein écran sans confusion | Test Playwright complet |
| Actions bot compréhensibles sans ouvrir le journal | Messages "Dernière action" visibles |
| Vocabulaire de jeu compréhensible pour nouveau joueur | Guide + glossaire accessible in-game |
| Bases et avant-postes compris sans documentation externe | UI claire + aide dans modale |
| Boutons hiérarchisés et cohérents | Audit visuel + tests touch targets |
| 0 régression portrait | Tests existants verts |
| npm run check GREEN sur toute la séquence | CI |

---

## Séquence de patchs V0.2

| Patch | Sujet | Type |
|---|---|---|
| 0051 | Direction produit (ce document) | doc |
| 0052 | Optimiser layout paysage plein écran | code + UX |
| 0053 | Actions bot visibles hors journal | code + UX |
| 0054 | Clarifier vocabulaire et microcopies | code + UX + doc |
| 0055 | Clarifier bases, avant-postes, activation | code + UX + doc |
| 0056 | Harmoniser barre d'actions et boutons | code + UX |
| 0057 | QA partie complète paysage plein écran | QA + audit |

---

## Risques

| Risque | Mitigation |
|---|---|
| Layout paysage optimisé casse le portrait | Tests portrait maintenus à chaque patch |
| Messages bot surchargent l'UI | Messages courts, disparaissent rapidement |
| Trop de texte pédagogique nuit à l'expérience | Aide accessible, non intrusive, optionnelle |
| Optimisation paysage casse les viewports contraints (740×340) | Tests Playwright multi-viewport maintenus |
