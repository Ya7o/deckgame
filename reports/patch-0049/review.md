# PATCH 0049 — Documentation V0.1

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests :** 274 / 274 GREEN (inchangé — aucune modification source)
**Playwright :** aucun nouveau test (pas de code UI modifié)

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `README.md` | Mis à jour — V0.1, stack, docs, historique 0031–0050 |
| `docs/user-guide-v0.1.md` | Nouveau — règles, interface, boutons, bot |
| `docs/mobile-pwa-guide.md` | Nouveau — PWA, orientations, viewports, limitations |
| `reports/patch-0049/review.md` | Nouveau — ce rapport |

---

## Contenu de la documentation

### README.md

- Titre mis à jour : V0.1
- Section "Jouer" avec URL de déploiement + instructions PWA
- Hooks `useOrientation`, `useFullscreen` ajoutés à l'arborescence
- Référence vers les deux nouveaux guides docs/
- Historique étendu aux patchs 0031–0050

### docs/user-guide-v0.1.md

- Objectif du jeu, déroulement d'un tour
- Types de cartes, factions et effets alliés
- Schéma ASCII des layouts portrait et paysage
- Tableau de tous les boutons avec leurs actions
- Explication des choix pendants et du bot

### docs/mobile-pwa-guide.md

- Matrice de compatibilité navigateurs/OS
- Instructions installation PWA Android Chrome
- Plein écran : disponibilité selon plateforme
- Viewports testés (audit PATCH 0046)
- Limitations connues V0.1 (icônes PNG, screenshots manifest, etc.)

---

## Sécurité gameplay

- Aucune modification moteur / UI / tests ✅
- Documentation uniquement ✅

---

## Statut final

| Critère | Résultat |
|---|---|
| `npm run check` (274 tests + build) | ✅ GREEN |
| README à jour | ✅ |
| Guide utilisateur | ✅ |
| Guide mobile/PWA | ✅ |
| Gameplay modifié | ✅ Non |
