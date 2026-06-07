# PATCH 0011 — Améliorer la lisibilité mobile et la hiérarchie d'interface

## Objectif
Améliorer la lisibilité mobile et la hiérarchie d'interface sans changer les règles,
le moteur, les cartes, ni l'équilibrage.

---

## Problèmes visuels traités

| Problème | Avant | Après |
|---|---|---|
| Label Commerce tronqué | `"C : 3"` (premier caractère de "Commerce") | `"Commerce : 3"` |
| Grilles de cartes non scrollables | `flexWrap: "wrap"` — cartes trop petites ou chevauchées | `overflowX: "auto"` + `flexWrap: "nowrap"` — scroll horizontal |
| Labels cryptiques dans CardView | `P2`, `+2A`, `Cop. vais.`, `AVP.`, `VAIS.` | `Pioche 2`, `+2♥`, `Copie vais.`, `Avant-p.`, `Vais.` |
| Aucun indicateur faction sur carte | — | Bande de couleur en haut de chaque carte |
| Aucun état visuel "jouable" | Toutes les cartes identiques | Glow bleu sur cartes jouables, rouge sur bases attaquables |
| Attaque directe bloquée sans explication | Bouton absent, aucun message | Message explicite « Avant-poste bloque l'attaque directe » |
| Safe area mobile non supportée | Contenu coupé sous la barre navigateur | `viewport-fit=cover` + `env(safe-area-inset-bottom)` |
| Langue HTML incorrecte | `lang="en"` | `lang="fr"` |
| Bas de page sans padding safe area | Rien | `paddingBottom: env(safe-area-inset-bottom, 0px)` |
| Labels ressources non lisibles | `fr.resources.trade[0]` = "C" | `fr.resources.trade` = "Commerce" |
| `--text-muted` trop sombre | `#8888aa` | `#9999bb` (meilleur contraste) |
| Tour bot sans bannière visible | Texte discret | Bannière accent + bord bleu + fontWeight bold |
| Combat disponible sans contexte | `⚔ : 5` | `⚔ Combat : 5` |

---

## Fichiers modifiés

| Fichier | Nature des changements |
|---|---|
| `index.html` | `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-capable`, `lang="fr"` |
| `src/index.css` | `#root min-height: 100dvh`, `--text-muted` plus clair, badges `.badge-base` et `.badge-ship` plus contrastés |
| `src/ui/CardView.tsx` | Bande de couleur faction, labels compacts lisibles, badges renommés, états visuels `playable`/`attackable` |
| `src/ui/GameBoard.tsx` | Scroll horizontal pour toutes les grilles de cartes, fix `fr.resources.trade`, label Combat complet, attaque simplifiée (un seul bouton), message blocage avant-poste, safe area main, isBotTurn bloque les interactions |
| `src/ui/CardDetailModal.tsx` | Bande couleur faction, `paddingBottom: env(safe-area-inset-bottom)`, labels améliorés |

---

## Choix UX retenus

- **Scroll horizontal** pour la main, la rangée commerciale et la zone en jeu : préserve la taille des cartes sans les réduire, évite la troncature sur mobile.
- **Attaque directe = bouton unique** `⚔ Attaquer (N)` qui attaque avec tout le Combat disponible. Suppression de l'input numérique (mauvaise ergonomie tactile). L'attaque partielle reste possible via `attackBase` sur les bases adverses.
- **États visuels additifs** : glow bleu pour jouable, glow rouge pour attaquable. N'interfère pas avec l'état `selected` existant.
- **Bande de couleur faction** en 3 px en tête de carte : repérage immédiat sans texte supplémentaire.
- **Labels ressources complets** dans la barre : `Commerce`, `Combat` plutôt que lettres isolées.
- **isBotTurn bloque l'UI** : pendant le délai avant `runBotTurn`, les boutons et clicks sont conditionnés à `!isBotTurn` (sécurisation légère, fondation pour PATCH 0012).

---

## Changements layout mobile

- `html` : `height: 100%`; `body` : `height: 100%; overflow: hidden` (inchangé mais séparé proprement)
- `#root` : `min-height: 100dvh` ajouté en supplément de `height: 100%`
- Toutes les zones de cartes wrappées dans un `div { overflowX: "auto" }` → cartes dans un `div { flexWrap: "nowrap" }`
- La main utilise `flex: 1 / minHeight: 0 / flexDirection: column` pour s'adapter à la hauteur restante
- `paddingBottom: env(safe-area-inset-bottom, 4px)` sur la zone des cartes en main
- `paddingBottom: calc(16px + env(safe-area-inset-bottom, 0px))` sur le modal de détail

---

## Changements cartes compactes

| Code | Avant | Après |
|---|---|---|
| `gain_authority` | `+2A` | `+2♥` |
| `draw` | `P2` | `Pioche 2` |
| `copy_another_ship` | `Cop. vais.` | `Copie vais.` |
| `opponent_discard` | `Déf.` | `Déf.adv.` |
| `scrap_from_hand_or_discard` | `Éc.` | `Écart` |
| Type base outpost | `AVP.` | `Avant-p.` |
| Type base | `BASE` | `Base` |
| Type ship | `VAIS.` | `Vais.` |
| `self_scrap` | `Écart•` (partiel) | `Écart→+NC` (effets inclus) |

---

## Changements vue détail

- Bande de couleur faction (4 px) en haut du panneau
- Safe area `paddingBottom`
- Séparateurs `·` au lieu de `•` pour la lisibilité
- `AVANT-POSTE` affiché en rouge et majuscules dans l'en-tête
- Tous les `allyEffects` affichés (pas uniquement le premier)
- Spacing légèrement amélioré

---

## Changements boutons/actions

- `fr.resources.trade[0]` → `fr.resources.trade` (BUG FIX)
- Bouton attaque directe : `⚔ Attaquer (5)` au lieu de `[input] [Attaquer]`
- Message d'avertissement avant-poste quand `!canAttackDirect && combat > 0`
- Badges avant-poste dans la zone adverse (🛡 N avant-poste(s))
- Boutons disabled pendant `isBotTurn`
- Bouton "Fin du tour" et "Abandonner" toujours visibles dans la barre

---

## Tests UI

Le projet utilise `vitest` avec `environment: "node"`. Il n'existe pas de setup `jsdom` ni
`@testing-library/react`. Ajouter des tests de rendu React aurait nécessité une infrastructure
complète (jsdom, @testing-library, config vitest dédiée), hors scope de ce patch.

Les 103 tests existants (moteur + bot + i18n) continuent de passer et couvrent le comportement
métier. Les changements UI n'affectent pas le moteur.

---

## Résultat npm run check

```
lint   : PASS — 0 warning, 0 error
tests  : 103 passed (69 moteur + 20 bot + 14 i18n)
build  : PASS — dist/index.js 261 kB / 75.4 kB gzip
```

---

## Captures visuelles

Les captures automatiques ne sont pas possibles depuis l'environnement WSL sans serveur
d'affichage (pas de Xvfb/Puppeteer configuré).

**Instructions pour captures manuelles :**

1. `npm run dev` dans `deckgame/`, ouvrir `http://localhost:5173/deckgame/`
2. Ouvrir les DevTools → onglet Device Toolbar → iPhone 14 Pro (390×844)
3. Captures attendues :
   - `screenshots/01-start-screen.png` — écran d'accueil avec bouton "Contre le Bot"
   - `screenshots/02-game-start.png` — début de partie, barre ressources avec "Commerce"
   - `screenshots/03-card-detail.png` — modal de détail d'une carte (tap sur carte)
   - `screenshots/04-buyable-card.png` — rangée commerciale avec badge ACHAT + glow
   - `screenshots/05-combat-available.png` — bouton "⚔ Attaquer (N)" visible
   - `screenshots/06-bot-turn.png` — bannière bleue "Le Bot réfléchit…"
   - `screenshots/07-outpost-warning.png` — message "Avant-poste bloque l'attaque directe"

Répertoire : `reports/patch-0011/screenshots/` (vide, captures à effectuer manuellement).

---

## Limites restantes

- **Attaque partielle** non disponible depuis la barre d'action (uniquement via `attackBase` sur les bases). Pour les utilisateurs avancés souhaitant des attaques partielles, la logique moteur supporte toujours plusieurs appels `attackOpponent`, mais l'UI ne l'expose plus directement.
- **Tests UI React** non ajoutés (infrastructure jsdom non présente, ajout hors scope PATCH 0011).
- **Animations** : aucune animation de tour bot ou de carte jouée (animations hors scope).
- **Taille de police** : les cartes restent à 9-10 px de police interne — lisibles sur retina mais denses sur écrans non-retina.
- **Icônes faction** : bande de couleur uniquement, pas d'icônes symboliques.

---

## Recommandations PATCH 0012

1. **Sécuriser les interactions pendant le tour bot** : bloquer dispatch côté moteur/UI plutôt que via flag `isBotTurn` (voir aussi demande explicite PATCH 0012).
2. **Mettre à jour le workflow GitHub Actions** (Node 20 → Node 24, actions à jour).
3. **Renseigner les hashes de commit manquants** dans les rapports 0002–0009.
4. **Tests UI légers** : configurer `vitest` avec `jsdom` pour valider que les boutons clés existent dans le DOM rendu.
5. **Icônes faction** : ajouter pictogrammes (1–2 caractères Unicode) dans la bande de couleur.
6. **Police adaptative** : `font-size: clamp(9px, 2.5vw, 11px)` sur les cartes compactes.

---

## Hash du commit

`20f28f9`
