# Périmètre V0 — Définition officielle

> Document créé par PATCH 0023 — 2026-06-07
> Feature freeze effectif à partir de PATCH 0022.

---

## 1. Ce qui est inclus dans la V0

| Fonctionnalité | État |
|---|---|
| Partie humain vs bot sur mobile (solo) | Inclus |
| Moteur de règles principal (achat, attaque, bases, avant-postes) | Inclus |
| Effets de cartes (primaires, alliés, auto-scrap, top-deck) | Inclus |
| Système de choix joueur (choose_one, select_cards, opponent_discard) | Inclus |
| Fin de tour, pioche, reshuffle | Inclus |
| Condition de victoire (autorité ≤ 0) | Inclus |
| Abandon (concede) | Inclus |
| Bot solo fonctionnel (profils : balanced, aggressive, economy, defensive) | Inclus |
| Simulation Bot vs Bot (runSimulation, runBatch) | Inclus |
| QA minimale reproductible (vitest, seeds déterministes) | Inclus |
| Build de production (vite, dist/) | Inclus |
| Documentation de lancement (README) | Inclus (PATCH 0027) |
| UI mobile-first (React, CSS variables, perspective joueur) | Inclus |
| Log d'actions en partie | Inclus |
| Modal de détail de carte | Inclus |
| Panel de choix en attente | Inclus |

---

## 2. Ce qui est exclu de la V0

| Fonctionnalité | Raison d'exclusion |
|---|---|
| Nouvelles cartes ou factions | Feature freeze |
| Nouvelles mécaniques de jeu | Feature freeze |
| Mode multijoueur réseau | Hors périmètre V0 |
| IA avancée ou apprentissage automatique | Hors périmètre V0 |
| Progression, compte ou score | Hors périmètre V0 |
| Refonte graphique ou animations complexes | Hors périmètre V0 |
| Équilibrage parfait | Non atteignable en V0 |
| Playwright e2e automatisé | Ubuntu 26.04 non supporté |
| Mode spectateur ou replay | Hors périmètre V0 |
| Support de navigateurs anciens | Hors périmètre V0 |
| Accessibilité complète (WCAG) | Hors périmètre V0 |

---

## 3. Critères de sortie V0

La V0 est prête si et seulement si tous les critères suivants sont vérifiés :

### 3.1 Critères qualité moteur
- [ ] npm run check passe : lint 0 erreur, tests tous verts, build OK
- [ ] 0 erreur moteur sur 200 parties simulées
- [ ] 0 violation d'invariant sur 200 parties simulées
- [ ] maxTurns jamais atteint sur 200 parties (seuil < 5%)
- [ ] Les 4 profils bot terminent des parties sans erreur

### 3.2 Critères qualité règles
- [ ] Effet allié Dreadnaught implémenté
- [ ] Validation minimum opponent_discard correcte
- [ ] Règle P1 draw-3 documentée ou corrigée

### 3.3 Critères UX mobile
- [ ] Tap carte = détail (pas d'action directe)
- [ ] Achat uniquement via bouton explicite ACHETER
- [ ] Main bot non exposée
- [ ] Actions humaines bloquées pendant tour bot
- [ ] Ressources (commerce, combat, autorité) lisibles sur mobile

### 3.4 Critères documentation
- [ ] README à jour avec commandes install/dev/test/build
- [ ] docs/v0-release-notes.md créé
- [ ] reports/patch-0023 à 0030 complétés

---

## 4. Feature freeze

**Effectif à partir du commit PATCH 0022 (24bee09).**

Après ce point, toute modification doit respecter les règles suivantes :
- Corrections de bugs uniquement (P0/P1 bloquants)
- Aucune nouvelle mécanique
- Aucun nouveau contenu (cartes, effets, profils)
- Aucune refonte UX non nécessaire à la jouabilité V0
- Toute modification doit être documentée dans le patch correspondant
