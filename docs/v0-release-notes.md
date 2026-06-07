# Notes de version V0 — Star Realms Prototype

> Date : 2026-06-07
> Tag : v0.0.0
> Branche : master
> Dernier commit : PATCH 0030

---

## Résumé

Star Realms V0 est un prototype jouable du jeu de cartes Star Realms (set de
base) implémenté en React + TypeScript. Il supporte un mode solo (humain vs
bot) et un mode 2 joueurs local sur mobile.

---

## Fonctionnalités incluses

### Moteur de jeu
- 52 cartes du set de base avec leurs effets primaires, alliés et de récupération
- Système de rangée commerciale (5 cartes + Explorateurs)
- Achat, jeu de cartes, effets de bases, avant-postes, fin de tour, reshuffle
- Système de choix : `choose_one`, `select_cards`, `opponent_discard`
- Condition de victoire : autorité adversaire ≤ 0
- Abandon (concede)
- Effets avancés : Aiguille Furtive (copie de vaisseau), Fleet HQ, Monde des Blobs

### Bot et simulation
- 4 profils de bot : `balanced`, `aggressive`, `economy`, `defensive`
- Simulation batch pour tests d'équilibrage
- RNG déterministe (seed) pour reproductibilité

### Interface utilisateur
- UI mobile-first (CSS variables, layout flex, scroll horizontal)
- Perspective joueur verrouillée en mode solo (main humaine toujours visible)
- Séparation tap (zoom) / bouton action (JOUER, ACHAT, ACTIV.)
- Panel de choix en attente (overlay)
- Modal de détail de carte
- Log d'actions en partie

---

## Qualité V0

| Métrique | Valeur |
|---|---|
| Tests automatisés | 190 (7 fichiers) |
| Erreurs moteur (200 parties RC) | 0 |
| Violations d'invariant (200 parties) | 0 |
| WinRate P1 (200 parties) | 51,5% |
| Tours moyens | 31,1 |

---

## Historique des patchs

| Patch | Description |
|---|---|
| 0001–0012 | Implémentation moteur de base et UI |
| 0013 | Blocage UI pendant tour bot |
| 0014 | Séparation zoom / achat (mobile) |
| 0015 | Choix bot auto-résolu / main bot masquée |
| 0016 | Actions explicites main / modal |
| 0017 | QA mobile automatisée (Playwright prévu, substitution Preview MCP) |
| 0018 | Audit qualité — identification backlog B-01/B-15 |
| 0019 | Simulation batch |
| 0020 | Tests d'équilibrage baseline |
| 0021 | Profils bot (4 profils, matchups cross) |
| 0022 | Fix buyScore efficiency (sqrt) — feature freeze |
| 0023 | Gel du scope V0 + backlog stabilisation |
| 0024 | Corrections P1 : Dreadnaught ally, opponent_discard, draw-3 |
| 0025 | Durcissement QA : +13 tests, batch 100 parties |
| 0026 | Stabilisation UX mobile : badge ACTIV., 11 flux vérifiés |
| 0027 | Cleanup V0 : dette B-07-B-15, README |
| 0028 | Release Candidate V0 — validation 200 parties, RC GREEN |
| 0029 | Skipped (aucun bloquant RC) |
| 0030 | Tag V0 + documentation finale |

---

## Limitations connues

- Avantage P1 résiduel (~51-54%) : règle de compensation draw-3 en place
- Explorer pile limitée à 16 instances (suffisant pour V0, illimité dans les vraies règles)
- Reshuffles déterministes uniquement si seed fourni à `setupGame`
- Tests e2e Playwright non disponibles (Ubuntu 26.04)
- Mode multijoueur réseau exclu du scope V0

---

## Lancer la V0

```bash
cd deckgame
npm install
npm run dev       # http://localhost:5173
npm run check     # lint + 190 tests + build
```
