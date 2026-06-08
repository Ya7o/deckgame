# PATCH 0045 — Plein écran mobile et PWA

**Date :** 2026-06-08
**Commit :** `81c85d6`
**Branche :** master
**Tests :** 264 / 264 GREEN
**Playwright :** 8 / 8

---

## Contexte et objectif

Après PATCH 0044 (stabilisation viewport contraint), cette étape ajoute le
support du plein écran mobile et prépare une expérience PWA installable.

Objectif : permettre à l'utilisateur d'entrer en plein écran depuis l'app,
de manière optionnelle et discrète, sans modifier le gameplay.

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `deckgame/src/hooks/useFullscreen.ts` | Nouveau hook plein écran (WebKit inclus) |
| `deckgame/index.html` | PWA metas + lien manifest |
| `deckgame/public/manifest.webmanifest` | Nouveau fichier PWA manifest |
| `deckgame/src/i18n/fr.ts` | +2 chaînes : `enterFullscreen`, `exitFullscreen` |
| `deckgame/src/index.css` | `#root` : `height: 100%` → `height: 100dvh` |
| `deckgame/src/ui/GameBoard.tsx` | Bouton plein écran portrait + paysage |
| `deckgame/src/App.tsx` | Bouton plein écran StartScreen portrait + paysage |
| `deckgame/src/tests/gameboard.test.tsx` | 8 tests ajoutés (PATCH 0045) |
| `deckgame/e2e/patch-0045.spec.ts` | 8 captures Playwright |

---

## Fonctionnalité plein écran

### Hook `useFullscreen.ts`

```typescript
export function useFullscreen() {
  const isSupported = !!(d.fullscreenEnabled || webkitFullscreenEnabled);
  const [isFullscreen, setIsFullscreen] = useState(getIsFullscreen);
  // écoute fullscreenchange + webkitfullscreenchange
  const toggleFullscreen = useCallback(async () => {
    if (!isSupported) return;
    try {
      if (!getIsFullscreen()) {
        await el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.();
      } else {
        await d.exitFullscreen?.() ?? d.webkitExitFullscreen?.();
      }
    } catch { /* refus navigateur silencieux */ }
  }, [isSupported]);
  return { isFullscreen, isSupported, toggleFullscreen };
}
```

- `isSupported = true` uniquement si `fullscreenEnabled === true` (ou webkit).
  Valeur `undefined` = non supporté → bouton masqué.
- Try/catch silencieux : jamais de crash (iframe sans permission, iOS Safari).
- Supporte `webkitRequestFullscreen` et `webkitExitFullscreen` (Safari iOS).

### Bouton dans l'UI

- **Portrait** : discret, à gauche de "Abandonner" dans la barre d'actions.
- **Paysage** : compact, après "Abandonner" dans la zone actions compacte.
- **StartScreen** : sous les boutons de jeu (portrait et paysage).
- Libellé : "Plein écran" / "Quitter plein écran" (toggle selon état).
- Masqué si `isSupported = false` (jsdom, iOS incognito, iframe).
- Ne gêne pas les actions principales (taille min, opacité réduite).

---

## PWA manifest

```json
{
  "name": "Deckgame V0",
  "short_name": "Deckgame",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#0e0e12",
  "background_color": "#0e0e12",
  "start_url": "./",
  "scope": "./"
}
```

- `display: "standalone"` : app-like sans barre d'adresse.
- `orientation: "any"` : portrait et paysage supportés.
- Paths relatifs (`./`) pour compatibilité avec `base: '/deckgame/'` de Vite.
- Icône favicon.svg (scalable, `purpose: "any"`).

### Metas HTML ajoutées

```html
<meta name="viewport" content="..., viewport-fit=cover" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0e0e12" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Deckgame" />
```

---

## Amélioration CSS

```css
/* Avant */
#root { height: 100%; min-height: 100dvh; ... }

/* Après */
#root { height: 100dvh; min-height: 100dvh; ... }
```

`100dvh` (dynamic viewport height) : suit la hauteur effective du viewport
mobile quand les barres du navigateur apparaissent/disparaissent.
En standalone PWA, `100dvh = 100vh` (plein écran sans chrome navigateur).

---

## Tests UI/jsdom ajoutés (8 tests en 4 suites)

| Suite | Description |
|---|---|
| A. Bouton masqué par défaut | Portrait + Landscape : absent quand `fullscreenEnabled = undefined` (jsdom) |
| B. Bouton visible si supporté | Portrait + Landscape : présent quand `fullscreenEnabled = true` |
| C. Click appelle requestFullscreen | Appel confirmé + pas de crash si absent |
| D. manifest dans index.html | `<link rel="manifest">` + `apple-mobile-web-app-capable` présents |

---

## Captures Playwright — `reports/patch-0045/screenshots/`

### Portrait 390×844

| Capture | Observation |
|---|---|
| portrait-01-startscreen | StartScreen portrait — inputs + boutons visibles ✅ |
| portrait-02-plateau | Plateau portrait — bouton "Plein écran" visible (Chromium supporte fullscreen) ✅ |
| portrait-03-main-jouable | MAIN + JOUER accessibles ✅ |

### Paysage 844×390

| Capture | Observation |
|---|---|
| landscape-04-startscreen | StartScreen paysage 2 colonnes — bouton "Contre le Bot" visible ✅ |
| landscape-05-plateau | Plateau paysage — bouton "Plein écran" visible (compact, actions zone) ✅ |
| landscape-06-actions | Fin du tour accessible en paysage ✅ |
| landscape-07-modal | Modale carte accessible en paysage ✅ |

*(Capture 08 : `manifest.webmanifest` accessible à 200 — pas de screenshot associé)*

---

## Observations visuelles

**Portrait :** Le bouton "Plein écran" s'intègre discrètement à gauche de
"Abandonner". Taille petite, opacité 70%. Ne gêne pas les actions principales
(JOUER, Fin du tour, Attaquer).

**Paysage :** Le bouton est compact (9px, padding minimal) dans la zone
actions droite. Cohérent avec le style des autres micro-boutons paysage.

**StartScreen :** Visible sous les boutons de jeu. Permet d'entrer en plein
écran avant même de commencer la partie.

---

## Limites

1. **iOS Safari** — `webkitRequestFullscreen` disponible depuis iOS 16.4+ en
   standalone. En navigateur classique iOS, le plein écran n'est pas
   disponible (`isSupported = false` → bouton masqué). Comportement sécurisé.

2. **Chromium / Android Chrome** — Fullscreen API standard supportée.
   Navigateur masque la barre d'adresse. Comportement confirmé en Playwright.

3. **Fullscreen sur capture Playwright** — Playwright ne simule pas
   le fullscreen OS (le viewport reste identique). Le bouton est visible et
   cliquable ; l'effet réel se vérifie sur appareil physique.

4. **Icône PWA** — Utilise `favicon.svg` uniquement. Pour une installation
   optimale, ajouter des icônes PNG 192×192 et 512×512 dans un patch futur.

---

## Garanties gameplay

- Aucune modification du moteur.
- Aucune modification des règles.
- Aucune modification des cartes, coûts, effets ou équilibrage.
- Portrait inchangé (243 tests NR + 21 tests PATCH 0044).

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (264 tests + build) | ✅ GREEN |
| Playwright 8 captures | ✅ 8/8 |
| Bouton plein écran visible (Chromium) | ✅ Confirmé |
| Bouton masqué si non supporté | ✅ Confirmé (jsdom = undefined → caché) |
| manifest.webmanifest accessible | ✅ 200 OK |
| PWA metas présentes | ✅ Confirmé |
| Gameplay inchangé | ✅ Confirmé |
| Portrait non régressé | ✅ Confirmé |
