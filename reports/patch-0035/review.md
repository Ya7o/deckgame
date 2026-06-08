# PATCH 0035 — Corrections UX visuelles post-analyse mobile

**Commit :** `031c973`
**Date :** 2026-06-08
**Branche :** master
**Statut :** GREEN — 197/197 tests · build propre

---

## Contexte

Après l'installation de Playwright (PATCH Playwright / session précédente) et la génération de 12 captures
d'écran à 390×844 (Chromium mobile portrait), une analyse visuelle a identifié 7 frictions UX.
Ce patch corrige l'ensemble de ces points sans modifier le gameplay ni le moteur de règles.

---

## Corrections appliquées

### Fix A — Grande zone vide sous la main (flex:1 → flexShrink:0)

**Problème :** La section MAIN avait `flex: 1`, lui faisant occuper tout l'espace restant de l'écran
(~450 px) même avec 3 cartes, laissant ~300 px de noir inutile au bas de l'écran.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`

**Correction :** Remplacement de `flex: 1` par `flexShrink: 0` sur le div HAND. La section est
désormais aussi haute que son contenu. L'espace résiduel est le fond global de l'app, non plus
une zone vide à l'intérieur de la section.

---

### Fix B — Bouton "Abandonner" trop proéminent

**Problème :** "Abandonner" (`className="danger"`) figurait dans la même rangée que "Fin du tour",
avec le même gabarit visuel. Risque d'appui accidentel sur mobile.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`

**Correction :** Bouton déplacé dans une rangée séparée, alignée à droite, avec style neutre
(`background: transparent`, bordure rouge à 25 % d'opacité, texte `text-muted`, `minHeight: 22px`).
"Fin du tour" reste le seul CTA primaire de la barre d'action.

---

### Fix C — Écran d'accueil mal proportionné

**Problème :** `justifyContent: "center"` centrait le contenu dans 844 px, laissant ~250 px de
noir au-dessus et en-dessous du contenu (~350 px).

**Fichier :** `deckgame/src/App.tsx`

**Correction :** `justifyContent: "flex-start"` + `paddingTop: "max(48px, 10%)"`. Le contenu est
positionné dans le tiers supérieur de l'écran, approche standard pour les écrans de démarrage mobiles.

---

### Fix D — Rangée commerciale sans indicateur de scroll

**Problème :** Le scroll horizontal de la rangée commerciale n'était pas signalé visuellement :
les cartes se coupaient net sur le bord droit.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`

**Correction :** `position: "relative"` ajouté au conteneur de la rangée. Un div de fondu
(`position: absolute, right: 0, top/bottom: 0, width: 28px, gradient transparent → #12121a,
pointerEvents: none, zIndex: 1`) superpose le bord droit pour signaler la continuité.

---

### Fix E — Tour bot : cartes de la main sans signal visuel de blocage

**Problème :** Pendant le tour du bot, les cartes de la main apparaissaient normalement (sans bouton
JOUER, correct fonctionnellement). Mais visuellement rien ne signalait leur indisponibilité.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`

**Correction :** Un overlay semi-transparent (`rgba(0,0,0,0.45)`) est appliqué sur l'ensemble de
la zone MAIN quand `isBotTurn === true`, signalant clairement que les cartes sont inaccessibles.

---

### Fix F — Message "Main vide" trop discret

**Problème :** Le message `handEmpty` était affiché en `fontSize: "12px"` sans distinction
visuelle, presque invisible.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`

**Correction :** `fontSize: "13px"`, `fontStyle: "italic"`, `padding: "14px 4px"`. Le message
reste discret mais est maintenant lisible.

---

### Fix G — Zone EN JEU : bande vide de 60 px en début de partie

**Problème :** `minHeight: "60px"` forçait la section EN JEU à afficher une bande vide au début
de chaque tour, avant que la première carte soit jouée.

**Fichier :** `deckgame/src/ui/GameBoard.tsx`, `deckgame/src/i18n/fr.ts`

**Correction :** Suppression de `minHeight: "60px"`. Ajout d'un message d'état vide conditionnel
(`{fr.ui.inPlayEmpty}` = "Aucune carte en jeu.") affiché quand `inPlay.length === 0 &&
bases.length === 0`. La section s'adapte à son contenu.

---

## Fichiers modifiés

| Fichier | Nature |
|---|---|
| `deckgame/src/ui/GameBoard.tsx` | Fixes A, B, D, E, F, G |
| `deckgame/src/App.tsx` | Fix C |
| `deckgame/src/i18n/fr.ts` | Ajout `ui.inPlayEmpty` |

---

## Pack de captures d'écran

Toutes les captures sont générées par Playwright 1.61.0-alpha, Chromium 149, viewport 390×844,
`deviceScaleFactor: 3`, `isMobile: true`, `hasTouch: true`, locale `fr-FR`.

Chemin : `deckgame/reports/screenshots/`

| Fichier | Scène |
|---|---|
| `01-accueil.png` | Écran d'accueil (Fix C visible : contenu en haut du tiers supérieur) |
| `02-debut-partie.png` | Début de partie, main 3 cartes, EN JEU vide avec message (Fix G) |
| `03-main-joueur-jouer.png` | Main du joueur avec boutons JOUER |
| `04-trade-row.png` | Rangée commerciale, fondu bord droit (Fix D) |
| `05-en-jeu-apres-jouer.png` | Après avoir joué la 1ère carte |
| `06-ressources-achat.png` | Toutes cartes jouées, ACHAT visible, "Main vide" en italique (Fix F) |
| `07-modal-detail-main.png` | Modale de détail (tap) — overlay opaque 0.85 |
| `08-modal-trade-row-overlay.png` | Modale rangée commerciale |
| `09-pret-fin-tour.png` | Commerce:3 généré, "Abandonner" séparé de "Fin du tour" (Fix B) |
| `10-tour-bot-banniere.png` | Bannière "Le Bot réfléchit…", main grisée (Fix E), EN JEU vide (Fix G) |
| `11-retour-tour-humain.png` | Retour tour humain après bot |
| `12-game-over.png` | Écran de fin de partie (abandon) |

---

## Analyse : passage en format 16/9 (paysage horizontal)

### Contexte

Le jeu fonctionne actuellement en portrait 9/16 (390×844). Le format 16/9 paysage (844×390)
modifierait radicalement l'organisation des zones.

### Avantages

| # | Avantage | Détail |
|---|---|---|
| 1 | **Zone de jeu plus large** | La rangée commerciale affiche 4–5 cartes sans scroll, au lieu de 2–3 en portrait. La main du joueur aussi. |
| 2 | **Zones adversaire / joueur symétriques** | En 16/9 paysage, haut = adversaire, bas = joueur — organisation naturelle comme un vrai jeu de cartes à la table. |
| 3 | **Moins de scroll vertical** | Toutes les zones tiennent sur un écran, élimination du scroll vertical entre sections. |
| 4 | **Lisibilité des cartes** | Les cartes à 80×112 occupent proportionnellement plus de surface sur 390 px de hauteur qu'en portrait. |
| 5 | **Adapté aux tablettes** | Un iPad en paysage profiterait idéalement du format 16/9. |

### Inconvénients

| # | Inconvénient | Détail |
|---|---|---|
| 1 | **Hauteur critique** | En 390 px de hauteur, empiler : adverse (70px) + trade (120px) + en jeu (80px) + ressources (65px) + main (145px) = 480 px → débordement inévitable. Il faudrait réduire toutes les zones. |
| 2 | **Cartes trop petites ou débordantes** | `--card-h: 112px` = 29 % de la hauteur totale en paysage. Soit les cartes dépassent, soit elles sont illisibles si réduites à ~80px. |
| 3 | **Navigation tactile dégradée** | La zone de pouce confortable sur un téléphone tenu à deux mains en paysage est étroite au bas de l'écran. Les boutons d'action seraient hors de portée naturelle. |
| 4 | **Refonte complète de la mise en page** | Le layout colonne actuel (flex-direction: column) ne fonctionnerait plus. Nécessiterait un layout grille ou un split horizontal, soit une réécriture de GameBoard. |
| 5 | **Incompatibilité avec les notions PWA/mobile** | La majorité des jeux de cartes mobiles (Hearthstone, Marvel Snap, etc.) utilisent le portrait pour l'interaction tactile. |

### Recommandation

Rester en portrait pour la V0. Si un mode 16/9 est envisagé (ex. : mode tablette), l'implémenter
comme une variante séparée (media query `@media (orientation: landscape)`) plutôt que de modifier
le layout actuel.

---

## Playwright : conditions de fonctionnement et limites

### Ce qui fonctionne

| Fonctionnalité | Statut | Notes |
|---|---|---|
| `npx playwright test` | ✅ | Chromium 149 binary, Ubuntu 26.04 |
| Captures d'écran 390×844 | ✅ | `deviceScaleFactor: 3`, images 1170×2532 |
| Navigation, click, tap, scroll | ✅ | `isMobile: true`, `hasTouch: true` |
| `page.goto(APP_URL)` | ✅ | URL absolue `/deckgame/` (non relative à baseURL) |
| `webServer.reuseExistingServer` | ✅ | Pas de double démarrage Vite si déjà actif |
| `preview_snapshot` (MCP Preview) | ✅ | Arbre d'accessibilité disponible dans WSL |

### Ce qui ne fonctionne pas / problèmes rencontrés

| Problème | Cause | Solution |
|---|---|---|
| `preview_screenshot` (MCP Preview) | Timeout WSL — le processus de capture d'image ne peut pas écrire dans le chemin Windows depuis WSL | Utiliser Playwright à la place |
| `devices["iPhone 12"]` Playwright | Requiert WebKit — binary inexistant sur Ubuntu 26.04 | Remplacer par `browserName: "chromium"` + viewport 390×844 manuel |
| `--with-deps` sur Ubuntu 26.04 | apt-get requiert sudo, timeout dans l'environnement CI/Claude | Installer le binary seul sans `--with-deps` |
| `__dirname` dans les specs | `__dirname` n'existe pas en module ES — erreur `ReferenceError` | Remplacer par `process.cwd()` |
| `baseURL: ".../deckgame"` + `goto("/")` | `/` est un chemin absolu depuis l'origine, ignore le baseURL | Conserver `baseURL: "http://localhost:5173"` et appeler `goto("/deckgame/")` explicitement |
| `mcp__computer-use__request_access` | Timeout dans l'environnement de cette session | Non bloquant — Playwright remplace l'usage |

### Configuration retenue (stable)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    locale: "fr-FR",
  },
  webServer: {
    command: "npm run dev -- --host 0.0.0.0 --port 5173",
    url: "http://localhost:5173/deckgame/",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [{
    name: "mobile-portrait",
    use: {
      browserName: "chromium",
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  }],
});
```

Lancer les captures : `npx playwright test e2e/screenshots.spec.ts --reporter=list`

---

## Résultats

- Tests : **197/197 GREEN**
- Build : **propre (tsc + vite)**
- Captures Playwright : **12/12**
- Durée du run screenshot : **8.9 s**
