# PATCH 0036 — Audit visuel mobile Playwright post-V0

**Commit :** à renseigner après push
**Date :** 2026-06-08
**Branche :** master
**Type :** QA / audit / documentation
**Statut :** GREEN — 197/197 tests · build propre · 13/13 captures Playwright

---

## Objectif

Réaliser un audit visuel mobile complet et reproductible avec Playwright (390×844, Chromium 149),
identifier les problèmes visuels restants après les PATCH 0032–0035, les classer par priorité,
et produire une matrice exploitable pour les prochains patchs correctifs.

**Aucune correction UI ni gameplay n'a été appliquée dans ce patch.**

---

## Commande Playwright

```bash
cd ~/apps/deck/deckgame
npx playwright test e2e/audit-visual.spec.ts --reporter=list
```

- **13 captures générées** en 12,9 s
- Stockées dans : `reports/patch-0036/screenshots/` (racine repo)
- Viewport : 390×844, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: fr-FR

---

## Dette structurelle — captures PATCH 0035 mal placées

Les captures du PATCH 0035 ont été générées dans `deckgame/reports/screenshots/`
(à l'intérieur du sous-dossier deckgame) au lieu de `reports/patch-0035/screenshots/`
(à la racine du repo). Ce patch corrige la trajectoire : les captures 0036 sont
correctement placées à `reports/patch-0036/screenshots/`.

Les 12 fichiers PNG de 0035 restent dans `deckgame/reports/screenshots/` (l'historique
git ne doit pas être réécrit). Ils sont documentés ici comme dette structurelle.

---

## Captures générées

| Fichier | État capturé |
|---|---|
| `01-accueil.png` | Écran d'accueil |
| `02-debut-partie.png` | Début de partie humain vs bot |
| `03-main-jouable-jouer.png` | Main joueur avec boutons JOUER |
| `04-detail-carte-main.png` | Modale détail carte (tap — voir limites) |
| `05-detail-carte-trade.png` | Modale détail carte rangée commerciale |
| `06-trade-row-scroll.png` | Rangée commerciale complète |
| `07-achat-visible.png` | Boutons ACHAT sur cartes abordables |
| `08-journal-ouvert.png` | Journal de partie ouvert |
| `09-pret-fin-tour.png` | Prêt pour fin de tour (ressources générées) |
| `10-tour-bot.png` | Bannière "Le Bot réfléchit…" |
| `11-retour-tour-humain.png` | Retour tour humain après bot (tour 2) |
| `12-base-en-jeu.png` | Base en jeu — best effort (voir limites) |
| `13-game-over.png` | Écran de fin de partie (abandon) |

---

## Matrice d'audit visuel

### P1 — Gêne forte, confusion majeure

| # | Écran | Problème | Capture | Recommandation | Patch proposé |
|---|---|---|---|---|---|
| P1-1 | Accueil | **Espace vide massif en bas (~55% noir)** — le contenu (titre + inputs + boutons + règles) occupe seulement le tiers supérieur malgré le Fix C (0035). Impression d'écran cassé sur un vrai appareil. | 01 | Ajouter un visuel central, une illustration ou une section "dernières parties". Ou utiliser `height: auto` + `minHeight: 100dvh` avec distribution verticale. | PATCH 0037 |
| P1-2 | Game over | **Même pattern vide** — "PARTIE TERMINÉE" + vainqueur + bouton + log = ~350px, le reste (~494px) est noir. Ni résumé, ni statistiques, ni animation. | 13 | Ajouter un résumé de partie (nombre de tours, autorité restante, raison). Distribuer verticalement. | PATCH 0037 |

---

### P2 — Friction UX visible

| # | Écran | Problème | Capture | Recommandation | Patch proposé |
|---|---|---|---|---|---|
| P2-1 | Main joueur | **Cartes partiellement visibles** — avec 5 cartes, seules 3–4 sont visibles. Le fondu droit (Fix D 0035) est peu perceptible sur fond sombre. Un scroll non initié perd les 5e et 6e cartes. | 03, 10, 11 | Ajouter un compteur "N cartes" et renforcer le fondu droit (gradient plus long, couleur plus contrastée). | PATCH 0038 |
| P2-2 | Rangée commerciale | **Noms de cartes tronqués** — "Yacht de l'Ambassade" → "Yacht de l'Ambassad...", "Robot Ravitailleur" coupé. 80px de largeur insuffisant pour ~30% des noms. | 02, 06 | Option A: réduire la taille de police à 9px dans les cartes. Option B: permettre un wrapping contrôlé sur 2 lignes. Option C: tooltip au tap (déjà présent via modale). | PATCH 0038 |
| P2-3 | Tour bot | **Overlay main indistinct** — l'overlay `rgba(0,0,0,0.45)` (Fix E 0035) n'est pas visuellement perceptible contre le fond sombre des cartes (#1a1a24). Les cartes semblent identiques à l'état jouable. | 10 | Augmenter l'opacité (0.6+) ou changer la teinte de l'overlay (bleu foncé pour signaler "attente") ou désaturer les cartes avec `filter: grayscale(60%)`. | PATCH 0038 |
| P2-4 | Journal | **Déborde hors du viewport** — le journal s'ouvre en bas de toutes les sections. Sur 844px, il est partiellement ou totalement hors de l'écran visible. Inaccessible sans scroll alors que l'app ne scrolle pas globalement. | 08 | Transformer le journal en overlay/tiroir flottant indépendant du flux principal, ou le superposer à la zone EN JEU. | PATCH 0039 |
| P2-5 | Barre d'actions | **"× Attaquer (N)" trop dominant** — le bouton rouge prend toute la largeur et s'impose comme CTA prioritaire. Risque d'attaque directe accidentelle sur mobile (zone tactile 44px de hauteur insuffisante). | 07, 09 | Réduire la largeur (auto, pas 100%), ajouter une confirmation ou un délai, ou le déplacer dans une position moins centrale. | PATCH 0038 |
| P2-6 | Main vide | **Espace noir résiduel sous "Main vide"** — même avec le Fix A (0035), il reste ~35% de noir sous le message "Main vide — terminez le tour pour piocher.". Le flexShrink:0 sur la HAND div n'élimine pas l'espace résiduel du conteneur parent. | 07, 09 | Vérifier que le conteneur parent (`overflow: hidden, height: 100%`) n'a pas de background visible en dessous du contenu. Ajouter un éventuel `background: var(--bg)` sur le root. | PATCH 0037 |

---

### P3 — Polish / dette mineure

| # | Écran | Problème | Capture | Recommandation | Patch proposé |
|---|---|---|---|---|---|
| P3-1 | Accueil | **Aucune identité visuelle** — fond noir uni, pas d'icône, pas d'illustration, pas de branding autre que le titre texte. | 01 | Ajouter un logo SVG ou une illustration de carte stylisée. | PATCH 0040 |
| P3-2 | EN JEU vide | **"Aucune carte en jeu." quasi invisible** — opacity: 0.4 rend le message trop discret pour servir de feedback utile. | 02, 10 | Augmenter opacity à 0.6, ou utiliser `color: var(--text-muted)` sans opacity supplémentaire. | PATCH 0037 |
| P3-3 | Modale | **Bouton fermer (×) zone tactile petite** — le bouton × en top-right de la modale fait ~32×32px alors que la recommandation mobile est 44×44px minimum. | 04, 05 | Agrandir la zone tactile du bouton fermer à `minWidth: 44px, minHeight: 44px`. | PATCH 0038 |
| P3-4 | Retour tour | **Pas de signal visuel de changement de tour** — après le tour du bot, le joueur ne reçoit aucun feedback visuel (pas d'animation, pas de flash, pas de message temporaire). | 11 | Ajouter un message temporaire "Votre tour !" pendant 1,5s au début du tour humain. | PATCH 0039 |
| P3-5 | Game over | **Pas de résumé ni statistiques** — "par abandon" seul, sans durée de partie, autorité finale, nombre de tours. | 13 | Ajouter le nombre de tours joués et l'autorité restante du vainqueur. | PATCH 0037 |
| P3-6 | Trade row | **Fondu bord droit peu perceptible** (Fix D 0035) — le gradient `transparent → #12121a` se confond avec le fond de section. | 06 | Renforcer le contraste du gradient ou ajouter un indicateur "→" textuel. | PATCH 0038 |
| P3-7 | Accueil | **Boutons "2 Joueurs" et "Contre le Bot" identiques** — même style, même taille, aucune hiérarchie. "Contre le Bot" devrait être le CTA principal (mode solo standard). | 01 | Différencier visuellement : "Contre le Bot" → bouton primary, "2 Joueurs" → bouton secondaire. | PATCH 0037 |

---

## États non capturés (limites Playwright)

| État | Raison | Alternative |
|---|---|---|
| **Base ou avant-poste en jeu** | Nécessite d'acheter et jouer une base (trade aléatoire, pas de carte garantie) | Forcer via un seed aléatoire fixé ou mock du deck |
| **Blocage par avant-poste adverse** | Nécessite que le bot ait joué un avant-poste | Trop aléatoire |
| **PendingChoicePanel** | Nécessite une carte déclenchant un choix (non garanti tour 1) | Ajouter une seed pour forcer ce cas |
| **Carte achetée apparaissant en défausse** | Nécessite 2 tours complets | Possible mais lent |
| **Activiation de base** | Nécessite achat puis jeu d'une base | Voir "Base en jeu" |

---

## Limites du script d'audit

| Limite | Impact | Correction future |
|---|---|---|
| `[title]` locator non discriminant | Test 04 "détail carte main" capture une carte de la rangée commerciale (trade row cards ont des titres ET viennent avant dans le DOM) | Sélectionner les cartes main via un sélecteur spécifique (section MAIN → `[title]`) |
| `endTurnAndWaitBack` attend `isVisible()` pas `isEnabled()` | Test 12 prend le screenshot pendant le tour bot (Fin du tour visible mais disabled) | Ajouter `await expect(finBtn).toBeEnabled({ timeout: 8_000 })` |
| Captures PATCH 0035 dans `deckgame/reports/screenshots/` | Dette structurelle, hors repo root | Documentée ici, à ne pas résorber en réécrivant l'historique |

---

## Récapitulatif des problèmes

| Priorité | Nombre | Patchs proposés |
|---|---|---|
| P0 — bloquant | 0 | — |
| P1 — confusion majeure | 2 | PATCH 0037 |
| P2 — friction UX | 6 | PATCH 0037, 0038, 0039 |
| P3 — polish / dette | 7 | PATCH 0037, 0038, 0039, 0040 |
| **Total** | **15** | |

---

## Plan des patchs correctifs proposés

| Patch | Contenu |
|---|---|
| **PATCH 0037** | Espaces vides P1 : accueil + game over + résiduel main vide + EN JEU vide opacity + hiérarchie boutons accueil |
| **PATCH 0038** | Friction main + trade row : compteur cartes, fondu renforcé, noms cartes, overlay bot, bouton Attaquer, fermer modale |
| **PATCH 0039** | Journal flottant + signal de changement de tour |
| **PATCH 0040** | Identité visuelle accueil (logo/illustration) |

---

## Confirmation

- ✅ Aucune correction UI appliquée dans ce patch
- ✅ Aucune modification gameplay
- ✅ Aucune modification moteur, cartes, équilibrage
- ✅ 197/197 tests GREEN
- ✅ Build propre (tsc + vite)
- ✅ 13 captures Playwright dans `reports/patch-0036/screenshots/`
- ✅ Captures PATCH 0035 documentées (dette structurelle `deckgame/reports/screenshots/`)
