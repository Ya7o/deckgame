# PATCH 0042 — QA Playwright paysage et décision d'activation

**Date :** 2026-06-08
**Commit :** à renseigner après push
**Branche :** master
**Tests :** 236 / 236 GREEN
**Playwright :** 14 / 14 (7 portrait + 7 landscape)

---

## Objectif

Audit comparatif complet portrait (390×844) vs paysage (844×390) après les
PATCH 0039–0041. Décider si le mode paysage est prêt à être activé.

---

## Captures réalisées (`e2e/qa-0042.spec.ts`)

| Scénario | Portrait | Landscape |
|---|---|---|
| 01 Accueil | ✅ | ⚠️ P1 |
| 02 Plateau début | ✅ | ✅ |
| 03 Modale carte | ✅ | ✅ |
| 04 Achat visible | ✅ | ✅ |
| 05 Journal ouvert | ✅ | ✅ |
| 06 Tour bot | ✅ | ✅ |
| 07 Game-over | ✅ | ✅ |

---

## Analyse par scénario

### 01 — Accueil
- **Portrait :** Titre, champs, boutons, description — tous visibles. ✅
- **Landscape :** Titre et boutons (2 Joueurs, Contre le Bot) visibles et
  cliquables. La description règles en bas est tronquée (hors viewport).
  Non bloquant pour le jeu mais incomplet visuellement. ⚠️ **P1**

### 02 — Plateau début de partie
- **Portrait :** Bot header, rangée commerciale 5 cartes, EN JEU, ressources,
  MAIN 3 cartes avec JOUER. Scroll requis pour voir toutes les sections. ✅
- **Landscape :** Toutes les sections visibles sans scroll : bot header compact,
  rangée commerciale (cartes 68×90), EN JEU micro-cartes, ressources + actions
  à droite, MAIN en bas. Ergonomie excellente pour un jeu. ✅

### 03 — Modale carte
- **Portrait :** Panneau pleine largeur, nom + faction + effets + actions.
  maxHeight 65 vh. ✅
- **Landscape :** Panneau pleine largeur, maxHeight 78 vh. Contenu lisible,
  effets long (ex. "Écartez-vous → Piochez 1 carte…") affiché sans troncature.
  Bouton ✕ 44×44 px accessible. ✅

### 04 — Achat visible (Commerce disponible)
- **Portrait :** Badges ACHAT jaunes sur les cartes accessibles. EN JEU cartes
  jouées, ressources mises à jour. ✅
- **Landscape :** Badges ACHAT visibles sur toutes les cartes abordables. Micro-
  cartes EN JEU lisibles. Ressources (Commerce 3) et bouton "Fin du tour"
  bien en vue. ✅

### 05 — Journal ouvert
- **Portrait :** Panneau journal en bas de l'écran, 5+ entrées visibles,
  bouton Journal + bouton ✕. ✅
- **Landscape :** Overlay journal occupe ~45 % de la hauteur viewport. En-tête
  "Journal" + bouton ✕ 44 px à droite. 5 entrées visibles. Plateau toujours
  partiellement visible derrière. ✅

### 06 — Tour bot
- **Portrait :** Bannière "⏳ Le Bot réfléchit…" en haut (bord bleu).
  MAIN grisée avec label "Tour du Bot". JOUER absent (correct). ✅
- **Landscape :** Même bannière en haut. MAIN grisée avec label "Tour du Bot".
  JOUER absent. Rangée commerciale et ressources toujours visibles. ✅

### 07 — Game-over
- **Portrait :** Écran centré — titre, vainqueur, raison, bouton "Nouvelle
  partie", log en bas. ✅
- **Landscape :** Layout 2 colonnes — gauche (300 px) : résultat + CTA ;
  droite (flex 1) : GameLog scrollable. Séparateur vertical visible.
  Bouton "Nouvelle partie" centré dans la colonne gauche. ✅

---

## Inventaire des issues

### P0 — Bloquants (empêchent le jeu)
*Aucune.*

### P1 — Importants (UX dégradée)
| ID | Scénario | Description | Correction proposée |
|---|---|---|---|
| L-P1-01 | Accueil | Description règles tronquée en bas à 390 px de hauteur | Ajouter layout paysage à l'écran d'accueil : champs + boutons à gauche, description à droite |

### P2 — Mineurs (cosmétique ou cas rare)
| ID | Scénario | Description | Correction proposée |
|---|---|---|---|
| L-P2-01 | Rangée commerciale | Noms de cartes longs (ex. "Robot Ravitailleur") serrés en 68 px | Accepté : nom sur 3 lignes avec clamp, lisible |
| L-P2-02 | EN JEU micro-cartes | Icônes très petites (48×54 px) quand plusieurs cartes en jeu | Acceptable en V0 — améliorer si retour utilisateur |
| L-P2-03 | Game-over | Colonne droite (log) vide si la partie est très courte | Non bloquant : log affiche toujours les 2 entrées minimum |

### P3 — Cosmétiques
| ID | Scénario | Description |
|---|---|---|
| L-P3-01 | Plateau | Explorateurs "×16" dans rangée commerciale — affichage identique portrait |
| L-P3-02 | Modale | Bouton "Fermer" texte sous le bouton ✕ — double fermeture ; peut être simplifié |

---

## Décision d'activation

### ✅ OUI — Le mode paysage est prêt à être activé

**Justification :**
- Aucun P0 bloquant détecté
- Toutes les actions de jeu sont accessibles en paysage
- La modale, le journal et le GameOver fonctionnent correctement
- Le seul P1 (accueil tronqué) n'empêche pas de jouer — la CTA "Contre le
  Bot" reste visible et cliquable
- 236/236 tests unitaires GREEN, 14/14 captures Playwright sans erreur

**Corrections à apporter en PATCH 0043 :**
1. **(P1) Accueil landscape** — Ajouter layout 2 colonnes : form à gauche,
   description à droite (ou scroll vertical si plus simple)
2. **(P2) Noms de cartes** — Vérifier overflow sur cartes courtes (68 px) ;
   ajuster si nécessaire
3. **(P2) Micro-cartes EN JEU** — Évaluer lisibilité avec 4+ cartes en jeu
   simultanément, ajuster padding si besoin
4. **(P3) Modale** — Supprimer le bouton texte "Fermer" si le ✕ 44 px suffit,
   ou les conserver tous les deux pour accessibilité

---

## Statut final PATCH 0042

| Critère | Résultat |
|---|---|
| `npm run check` (236 tests + build) | ✅ GREEN |
| Playwright 14 captures | ✅ 14/14 |
| Issues P0 | 0 |
| Issues P1 | 1 (accueil tronqué — non bloquant) |
| Issues P2 | 3 (cosmétiques) |
| **Décision activation** | **✅ OUI** |
