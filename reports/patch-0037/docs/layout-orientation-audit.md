# Audit comparatif portrait vs paysage — PATCH 0037

**Date :** 2026-06-08  
**Viewports :** Portrait 390×844 · Landscape 844×390  
**deviceScaleFactor :** 3 (captures en 1170×2532 et 2532×1170, analysées en ÷3)  
**Spec Playwright :** `deckgame/e2e/compare-orientations.spec.ts`  
**Résultats :** 22/22 tests passés (11 portrait + 11 landscape), 18,1 s

---

## Structure de l'interface analysée

L'interface deckgame est composée de 5 zones empilées verticalement :

1. **Barre Bot** — stats adversaire (autorité, pioche, défausse, main)
2. **RANGÉE COMMERCIALE** — 5 cartes + pioche explorateurs (scroll horizontal)
3. **EN JEU** — cartes jouées ce tour (scroll horizontal)
4. **Barre ressources + actions** — commerce, combat, boutons Journal / Fin du tour / Abandonner
5. **MAIN** — cartes en main du joueur (scroll horizontal, avec JOUER)

---

## Analyse par section

### 1. Barre Bot

| | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Lisibilité | ✅ Compacte, tous les stats lisibles | ✅ Identique — barre sur une ligne |
| Espace occupé | ~40px | ~40px |
| Verdict | Équivalent | Équivalent |

---

### 2. RANGÉE COMMERCIALE

| | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Cartes visibles sans scroll | 4,5 (5e partiellement coupée) | **6 cartes complètes** + pile explorateurs |
| Noms de cartes | ⚠️ Tronqués : "Yacht de l'Ambassad e", "Rob..." | ✅ **Tous lisibles** : "Comptoir Commercial", "Croiseur de Bataille", "Mech de Guerre" |
| Coûts, factions | ✅ Visibles | ✅ Visibles |
| Boutons ACHAT | ✅ Visibles quand abordables | ✅ Visibles (mais haut de la rangée sort du viewport si la page scrolle) |
| Scroll nécessaire | Horizontal pour 5e+ carte | Aucun — toute la rangée tient |
| **Verdict** | ⚠️ Fonctionnel avec friction | ✅ **Net avantage paysage** |

---

### 3. EN JEU

| | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Cartes visibles | ✅ 3 cartes + espace vide | ✅ 3 cartes (zone moins haute mais suffisante) |
| Message "Aucune carte en jeu." | ✅ Visible | ✅ Visible |
| Espace gaspillé (vide) | ⚠️ Zone haute (~120px) quand vide | Compact — moins d'espace gaspillé |
| **Verdict** | Fonctionnel | Légèrement supérieur |

---

### 4. Barre ressources + actions

| | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Commerce, Combat | ✅ Lisibles, en ligne | ✅ Lisibles, en ligne |
| Journal, Fin du tour | ✅ Boutons bien visibles | ✅ Identique |
| Abandonner | ✅ Ligne muted séparée | ✅ Aligné à droite sur la même ligne |
| **Verdict** | Équivalent | Équivalent |

---

### 5. MAIN (zone critique)

| | Portrait 390×844 | Landscape 844×390 |
|---|---|---|
| Cartes visibles | ✅ **3–5 cartes avec JOUER visibles** | ❌ **En-tête seulement — cartes hors écran** |
| Boutons JOUER | ✅ Accessibles sans scroll | ❌ Non visibles sans scroll vertical |
| Scroll vertical requis | Non | **Oui — obligatoire pour jouer** |
| Tour bot (overlay) | ✅ Overlay visible | ❌ Non applicable (MAIN hors écran) |
| Main vide (message) | ✅ Visible | ✅ "Main vide" visible (mais cartes ne le seraient pas) |
| **Verdict** | ✅ **Fonctionnel** | ❌ **Bloquant** |

---

## Résumé comparatif global

| Zone | Portrait | Landscape | Gagnant |
|---|---|---|---|
| Barre Bot | ✅ | ✅ | = |
| Rangée commerciale | ⚠️ | ✅ | **Landscape** |
| EN JEU | ✅ | ✅ | ≈ |
| Barre ressources | ✅ | ✅ | = |
| MAIN / jouabilité | ✅ | ❌ | **Portrait** |
| Espace vide global | ⚠️ | — | Landscape |
| Utilisabilité immédiate | ✅ | ❌ | **Portrait** |

---

## Problèmes spécifiques identifiés

### Portrait — problèmes connus (hérités de PATCH 0036)

| # | Section | Problème | Priorité |
|---|---|---|---|
| P-01 | Accueil | Espace vide massif ~55% bas de l'écran | P1 |
| P-02 | Game over | Même espace vide | P1 |
| P-03 | Rangée commerciale | Noms de cartes tronqués (80px largeur insuffisant) | P2 |
| P-04 | MAIN | Cartes partiellement visibles avec 5+ cartes (scroll partiel) | P2 |
| P-05 | EN JEU vide | Grande zone noire résiduelle | P3 |

### Landscape — problèmes nouveaux identifiés

| # | Section | Problème | Priorité |
|---|---|---|---|
| L-01 | MAIN | **Cartes hors écran** — le joueur ne peut pas voir ni jouer ses cartes sans scroll vertical | **P0 — bloquant** |
| L-02 | Rangée commerciale | Bords supérieurs hors viewport quand page scrollée vers MAIN | P1 |
| L-03 | Journal | Panel journal totalement hors viewport (aucune place verticale) | P1 |
| L-04 | EN JEU | Zone compressée, peu d'espace pour cartes jouées | P2 |
| L-05 | Global | Hauteur 390px insuffisante pour empiler toutes les sections | P0 — structurel |

---

## Analyse de la capture journal-ouvert (landscape)

En paysage, le panel journal (qui s'ouvre en bas du flux) est **complètement hors viewport**.
L'image `l_08-journal-ouvert.png` est identique à `l_07-achat-visible.png` : le journal n'est
pas visible du tout. En portrait, le journal s'affiche partiellement hors écran (P2-4 de l'audit
0036), ce qui reste un problème moindre que l'invisibilité totale en paysage.

---

## Conclusion

Le paysage offre un avantage clair pour la **rangée commerciale** (noms lisibles, pas de
scroll horizontal). Mais cet avantage est annulé par un **problème bloquant** : à 390px de
hauteur, les 5 sections empilées ne tiennent pas, et la MAIN — zone la plus utilisée pendant
un tour — est reléguée hors de l'écran. Le joueur ne peut pas voir ses cartes ni appuyer sur
JOUER sans un scroll vertical qui n'est ni évident ni naturel sur mobile.

---

## Recommandation

**→ Option A : Portrait reste l'orientation principale**

Justification :
1. La MAIN est la zone d'interaction prioritaire (1 à 6 appuis JOUER par tour) — elle doit
   être visible sans scroll
2. Le problème de noms tronqués en portrait (P2-3) est corrigeable par CSS (police 9px, ou
   wrap sur 2 lignes) sans refonte
3. L'espace vide en portrait est un problème de remplissage de contenu (P1-1/P1-2), pas
   d'orientation — il affecterait landscape de façon encore plus sévère
4. La hauteur 390px en paysage est structurellement insuffisante pour l'interface actuelle

### Ce qui serait nécessaire pour Option B (landscape)

Si le paysage devait devenir l'orientation principale, il faudrait une refonte de
l'architecture de layout :
- Passer à un layout 2 colonnes (trade row gauche / gameplay droite)
- Fixer la MAIN en bas avec `position: sticky` ou un panneau dédié
- Supprimer ou masquer le panel journal en paysage

Ce travail représente ~3–5 patchs UI et n'est pas justifié pour une app d'abord mobile.

### Ce qui serait nécessaire pour Option C (double layout)

- Détection d'orientation via `window.matchMedia('(orientation: landscape)')` ou
  CSS `@media (orientation: landscape)`
- Deux layouts distincts en React (condition sur orientation)
- Complexité de maintenance × 2

Également non recommandé au stade actuel.

---

## Plan correctif résultant (Option A confirmée)

Les correctifs PATCH 0038+ doivent cibler le portrait uniquement :

| Correctif | Problème portrait | Patch |
|---|---|---|
| Noms de cartes ≤ 2 lignes ou police 9px | P2-3 noms tronqués | PATCH 0038 |
| Compteur "N/6 cartes" + fondu renforcé | P2-1 cartes partiellement visibles | PATCH 0038 |
| Overlay bot plus opaque (0.6+) ou grayscale | P2-3 overlay indistinct | PATCH 0038 |
| Barre d'accueil : CTA primaire vs secondaire | P3-7 boutons identiques | PATCH 0037 |
| Espace vide accueil + game-over | P1-1, P1-2 | PATCH 0037 |
