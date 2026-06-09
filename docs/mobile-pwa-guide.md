# Guide mobile & PWA — Deckgame V0.1+

---

## Expérience recommandée : paysage plein écran

**Pourquoi le paysage ?**
- Toutes les zones de jeu visibles simultanément (main, rangée commerciale, actions)
- Aucun scroll vertical nécessaire pendant la partie
- Le mode plein écran supprime les barres de navigation pour maximiser l'espace

**Pourquoi le plein écran ?**
- Sur mobile, les barres de navigation réduisent l'espace disponible
- En plein écran, le layout s'adapte au viewport réel (100dvh)

---

## Comment jouer en paysage plein écran (Android Chrome)

1. Ouvrir https://ya7o.github.io/deckgame/ dans Chrome
2. Sur l'écran d'accueil, appuyer sur **Plein écran**
3. Tourner le téléphone en paysage
4. Lancer une partie

**Ou, pour une expérience PWA complète :**
1. Chrome → Menu → Ajouter à l'écran d'accueil
2. Lancer depuis l'écran d'accueil (mode standalone, sans barres)
3. Appuyer sur **Plein écran** depuis l'accueil
4. Tourner en paysage

---

## Portrait

Le portrait est supporté et fonctionnel. Il est adapté si :
- Vous préférez tenir votre téléphone à la verticale
- Votre navigateur ne supporte pas le fullscreen (iOS Safari en mode navigateur)
- Vous jouez dans un espace contraint

---

## Compatibilité

| Navigateur/OS | Paysage | Plein écran | PWA |
|---|---|---|---|
| Chrome Android | ✅ Recommandé | ✅ | ✅ |
| iOS Safari standalone | ✅ | ⚠️ Limité | ✅ (ajout à l'écran) |
| Firefox Android | ✅ | ❌ | ❌ |
| Chrome Desktop | ✅ | ✅ | ✅ |
| Safari macOS | ✅ | ❌ | ❌ |

---

## Viewports testés (audit PATCH 0046)

| Viewport | Orientation | Résultat |
|---|---|---|
| 390×844 | Portrait | ✅ Complet |
| 844×390 | Paysage | ✅ Recommandé |
| 800×360 | Paysage contraint | ✅ OK |
| 740×340 | Paysage très contraint | ✅ OK |

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

**Note V0.1 :** Icônes SVG uniquement. PNG 192×192 / 512×512 absents (qualité d'icône variable selon navigateur).

---

## Limitations connues V0.1

| Limitation | Détail |
|---|---|
| Icônes PWA PNG | Absentes — SVG uniquement |
| Screenshots manifest | Tableau vide (pas de promotion install Chrome/Edge) |
| Tour bot | Aucun indicateur visuel pendant le délai 600ms (prévu PATCH 0053) |
| Modal carte | Accès uniquement par tap sur le corps de la carte (hors JOUER) |
| iOS Safari | Fullscreen limité en mode navigateur ; disponible en standalone |
