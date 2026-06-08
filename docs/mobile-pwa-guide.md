# Guide mobile & PWA — Deckgame V0.1

---

## Compatibilité

| Navigateur/OS | Support |
|---|---|
| Chrome Android | ✅ Complet (PWA + Plein écran) |
| Safari iOS (standalone) | ✅ Layout adapté |
| Firefox Android | ✅ Layout (pas de fullscreen) |
| Chrome Desktop | ✅ Complet |
| Safari macOS | ✅ (sans fullscreen) |

---

## Installer en PWA (Android Chrome)

1. Ouvrez https://ya7o.github.io/deckgame/ dans Chrome
2. Menu → **Ajouter à l'écran d'accueil** (ou bannière d'installation automatique)
3. L'app se lance en mode standalone (sans barre de navigation)

---

## Plein écran

- Bouton **Plein écran** disponible sur l'écran d'accueil (si `document.fullscreenEnabled`)
- Sur iOS Safari : non disponible en mode navigateur ; disponible en mode standalone (PWA)
- Sur Android Chrome : disponible dans le navigateur et en PWA

---

## Orientations supportées

### Portrait (390×844, iPhone SE / standard)

- Layout vertical : adversaire en haut, main en bas
- Journal en bas (fermeture via bouton ×)
- Boutons primaires : **44px minimum** (Journal, Fin du tour)

### Paysage (844×390 et contraints jusqu'à 740×340)

- Layout compact : 3 colonnes
- Journal en overlay (position absolute)
- Testé jusqu'à 740×360px

---

## Viewports testés (audit PATCH 0046)

| Viewport | Orientation | Résultat |
|---|---|---|
| 390×844 | Portrait | ✅ Complet |
| 844×390 | Paysage | ✅ Complet |
| 800×360 | Paysage contraint | ✅ OK |
| 740×340 | Paysage très contraint | ✅ OK (MAIN 160px) |

---

## PWA — manifest.webmanifest

```json
{
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#0e0e12",
  "start_url": "./"
}
```

**Note V0.1 :** Le manifest utilise uniquement une icône SVG (`favicon.svg`).
Les icônes PNG 192×192 / 512×512 sont absentes — la qualité d'icône lors de l'installation
peut varier selon le navigateur.

---

## Limitations connues V0.1

| Limitation | Détail |
|---|---|
| Icônes PWA PNG | Absentes — SVG uniquement |
| Screenshots manifest | Tableau vide (pas de promotion install Chrome/Edge) |
| Tour bot | Aucun indicateur visuel pendant le délai 600ms |
| Modal carte | Accès uniquement par tap sur le corps de la carte (hors JOUER) |
