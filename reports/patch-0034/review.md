# PATCH 0034 — Consolider les libellés et microcopies mobile

## Objectif

Améliorer les libellés courts et microcopies visibles sur mobile
sans changer les règles ni les effets de cartes.

---

## 1. Libellés modifiés

### 1.1 Bouton ACTIV. → Activer

**Fichier** : `src/ui/GameBoard.tsx`

**Avant** : hardcodé `"ACTIV."` — abréviation peu claire.

**Après** : `{fr.actions.activateBase}` = `"Activer"` — utilise la clé i18n
déjà définie dans `fr.actions`. Le bouton (80 px, fontSize 10px) positionné
sous la carte (PATCH 0032) a largement l'espace pour le mot complet.

**Impact tests** : 6 occurrences de `includes("ACTIV.")` mises à jour en
`includes("Activer")` dans `gameboard.test.tsx` (4 tests PATCH 0026 + 2 tests
PATCH 0033). Tous passent.

---

### 1.2 Abréviations des effets compacts dans CardView

**Fichier** : `src/ui/CardView.tsx` — fonction `summaryEffects`

Ces libellés apparaissent dans la zone "effets" compacte de la carte.
La modale détail conserve les textes complets.

| Avant | Après | Raison |
|---|---|---|
| `"Déf.adv."` | `"Déf. adv."` | Espace pour lisibilité |
| `"Détr.base"` | `"Détr. base"` | Espace pour lisibilité |
| `` `Déf.→P.` `` | `"Déf.→pioche"` | "P." illisible sans contexte |
| `"Vais.gratuit"` | `"Vais. gratuit"` | Espace pour lisibilité |

---

## 2. Libellés conservés

| Libellé | Raison |
|---|---|
| `"Vais."` (badge type vaisseau) | Compact, reconnaissable ; modale affiche "Vaisseau" complet |
| `"Avant-p."` (badge avant-poste) | Compact mais unique ; modale affiche "AVANT-POSTE" |
| `"Base"` (badge base) | Clair, non abrégé |
| `"JOUER"` / `"ACHAT"` | Déjà clairs, boutons d'action principaux |
| `"Allié•"` / `"Écart•"` | Indicateurs de présence suffisants |
| `"Copie vais."` | Assez clair dans le contexte |
| `"Allié ×4"` | Auto-explicatif |

---

## 3. Modales

Les modales (CardDetailModal.tsx) conservent tous les textes complets
(effets primaires, alliés, scrap en clair). Aucune modification.

---

## 4. Résultats

```
Tests    : 197 (inchangé)
Lint     : 0 erreur
Build    : OK
TypeScript : 0 erreur
```

---

## 5. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/ui/GameBoard.tsx` | ACTIV. → fr.actions.activateBase ("Activer") |
| `src/ui/CardView.tsx` | 4 abréviations améliorées dans summaryEffects |
| `src/tests/gameboard.test.tsx` | 6 finds "ACTIV." → "Activer" |

---

## 6. Confirmation scope

- Aucun effet de carte modifié.
- Aucune règle modifiée.
- Aucun moteur modifié.
- Aucun équilibrage modifié.
- Aucune transition vers contenu original commencée.
- Aucune refonte graphique.

---

## Hash du commit

- A remplir après git push
