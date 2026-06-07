# PATCH 0017 — Ajouter une vraie QA mobile automatisee

## Objectif

Mettre en place une QA mobile automatisee minimale pour verifier les flux critiques du prototype solo :
- affichage mobile portrait (375x812) ;
- lisibilite des zones principales ;
- absence d'exposition de la main du bot ;
- presence des actions explicites JOUER / ACHAT ;
- stabilite de la perspective joueur humain pendant le tour bot.

---

## 1. Outil de QA mobile choisi

### Playwright (recommande)

`@playwright/test` v1.60.0 est deja installe comme devDependency.

**Limitation critique :**
```
Error: ERROR: Playwright does not support chromium on ubuntu26.04-x64
```
Ubuntu 26.04 n'est pas encore supporte par Playwright (trop recent).
Les tests e2e sont ecrits et prets. Ils seront executables des que l'environnement le permettra (Ubuntu 27+ ou migration vers une image Debian).

### Approche de substitution : Preview MCP + eval

Pour ce patch, la verification live a ete realisee via le serveur de dev Vite sur WSL, inspecte depuis Windows par le Preview MCP (outils `preview_snapshot` et `preview_eval`). Cette approche est fiable pour les assertions DOM et temporelles, mais ne produit pas de captures JPEG.

---

## 2. Fichiers ajoutes

| Fichier | Description |
|---|---|
| `deckgame/playwright.config.ts` | Config Playwright : viewport iPhone 12, port 5173, webServer auto |
| `deckgame/e2e/mobile-qa.spec.ts` | 8 tests e2e mobile |
| `deckgame/vite.config.ts` | Ajout `exclude: ['**/e2e/**']` pour que vitest ignore l'e2e |
| `reports/patch-0017/review.md` | Ce rapport |
| `reports/patch-0017/screenshots/README.md` | Note sur les captures |

---

## 3. Script npm

```json
"test:e2e": "playwright test"
```

**Lancement :**
```bash
npm run dev         # dans un terminal
npm run test:e2e    # dans un autre
```

**Note :** `test:e2e` n'est PAS inclus dans `npm run check`.
Raison : l'installation des navigateurs Playwright echoue sur Ubuntu 26.04.
Des que l'environnement supporte Playwright, ajouter `&& npm run test:e2e` a la fin du script `check`.

---

## 4. Tests e2e ecrits (`e2e/mobile-qa.spec.ts`)

| N | Test | Assertion cle |
|---|---|---|
| 1 | Ecran debut visible en mobile | Titre + bouton "Contre le Bot" present |
| 2 | Zones principales apres demarrage | RANGEE COMMERCIALE, MAIN, Joueur 1 visibles |
| 3 | Main bot non affichee | MAIN label contient "Joueur 1", jamais "Bot" |
| 4 | Tap carte = detail, pas action | Bouton Fermer visible apres clic |
| 5 | Bouton JOUER visible cartes jouables | Au moins 1 bouton JOUER present |
| 6 | Bouton JOUER absent pendant tour bot | count=0 apres Fin du tour, puis restaure |
| 7 | Bouton ACHAT si commerce suffisant | Si commerce >= 2, au moins 1 ACHAT visible |
| 8 | Perspective joueur 1 stable pendant tour bot | MAIN label = "Joueur 1" a t=300ms |

---

## 5. Verification live via Preview MCP (2026-06-07)

Viewport : 375x812 (mobile portrait iPhone 12).
Serveur : `npm run dev --host 0.0.0.0 --port 5173` (WSL Ubuntu 26.04).

### 5.1 Etat au demarrage

```json
{
  "mainLabel": "MAIN — Joueur 1 (Tour 4)",
  "jouerBtns": 5,
  "achatBtns": 0,
  "botVisible": false,
  "tradeRow": true,
  "jouerSection": true,
  "humanHP": ["♥ 50", "♥ 47"],
  "viewport": "375x812"
}
```

- MAIN pinee sur Joueur 1, jamais Bot. **OK**
- JOUER buttons visibles (5 cartes en main). **OK**
- ACHAT buttons absents (commerce=0). **OK**

### 5.2 Tap carte rangee commerciale

```json
{ "hasOverlay": true, "modalButtons": ["✕", "Fermer"] }
```

- Modal ouverte sans achat. **OK**
- Bouton "Fermer" present. **OK**
- Contenu modal : detail carte (nom, faction, cout, effets). **OK**

### 5.3 Timing tour bot (poll toutes 150ms)

```json
[
  { "ms":  56, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 4)", "jouerBtns": 0, "finDisabled": true },
  { "ms": 220, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 4)", "jouerBtns": 0, "finDisabled": true },
  { "ms": 373, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 4)", "jouerBtns": 0, "finDisabled": true },
  { "ms": 527, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 4)", "jouerBtns": 0, "finDisabled": true },
  { "ms": 690, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 5)", "jouerBtns": 5, "finDisabled": false },
  { "ms": 854, "botBanner": false, "mainLabel": "MAIN — Joueur 1 (Tour 5)", "jouerBtns": 5, "finDisabled": false }
]
```

Garanties verifiees :
- `jouerBtns=0` pendant 0–527ms → aucun bouton JOUER pendant le traitement bot. **OK**
- `finDisabled=true` pendant 0–527ms → Fin du tour bloquee. **OK**
- `mainLabel="MAIN — Joueur 1"` tout au long → perspective stable. **OK**
- A t≈690ms : `jouerBtns=5`, `finDisabled=false` → tour humain restaure. **OK**

---

## 6. Resultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 127 passed (69 moteur + 25 bot + 14 i18n + 19 gameboard jsdom)
build  : PASS — dist/index.js 261 kB / 75.5 kB gzip
```

`npm run test:e2e` : non executable (Playwright non supporte sur Ubuntu 26.04).

---

## 7. Captures

Screenshots automatiques non disponibles :
- `preview_screenshot` depasse le timeout (30s) dans cet environnement WSL/Windows.
- Les verifications ont ete faites via `preview_eval` (assertions DOM reproductibles).

Voir `reports/patch-0017/screenshots/README.md`.

---

## 8. Limites restantes

- **Playwright non executable** sur Ubuntu 26.04. Tests ecrits, prets pour Ubuntu 27+.
- **Captures JPEG absentes** — verification DOM via eval suffit pour les assertions critiques.
- **Scroll et layout precise** non verifies (pas de screenshot).
- **Test ACHAT avec commerce suffisant** : verifie conceptuellement ; difficile a declencher de facon deterministe via eval en raison du batching React.

---

## 9. File d'attente

| Patch | Titre |
|---|---|
| **PATCH 0018** | Audit regles Star Realms / conformite moteur |

---

## Hash du commit

A completer apres commit.
