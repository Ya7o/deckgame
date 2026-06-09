# Guide utilisateur — Deckgame V0.1

Deckgame est un prototype jouable de **Star Realms** (set de base).
Ce guide couvre les règles de base et l'interface de jeu.

---

## Objectif du jeu

Réduire les **Points d'Autorité** de l'adversaire à 0.
Chaque joueur commence avec **50 PA**.

---

## Déroulement d'un tour

1. **Jouez des cartes** de votre main sur la table
   - Cliquez sur le bouton **JOUER** sous une carte, ou tapez sur la carte pour voir ses détails
   - Les cartes génèrent du **Commerce** (🟡) ou du **Combat** (🔴)

2. **Achetez des cartes** dans la rangée commerciale (6 cartes au centre)
   - Badge **Acheter** apparaît si vous avez assez de Commerce
   - Tapez sur une carte pour voir ses détails avant d'acheter

3. **Attaquez** l'adversaire avec votre Combat accumulé
   - Bouton **Attaquer** disponible si vous avez du Combat ET aucun avant-poste adverse

4. **Terminez votre tour**
   - Bouton **Fin du tour** — défausse votre main et vos cartes jouées, piochez 5 cartes

---

## Cartes et types

| Type | Couleur | Effet principal |
|---|---|---|
| Vaisseau | — | Joué depuis la main, défaussé en fin de tour |
| Base | Bordure colorée | Reste en jeu, donne des effets récurrents |

### Bases et avant-postes

| Situation | Ce qui se passe |
|---|---|
| Base en jeu, non activée | Badge **ACTIV.** visible — cliquez pour déclencher l'effet |
| Base en jeu, déjà activée | Badge **UTILISÉ** — disponible au prochain tour |
| Avant-poste adverse | Protège l'adversaire — doit être détruit avant toute attaque directe |
| Avant-poste attaquable | La **Défense** s'affiche — vous devez avoir autant de Combat pour le cibler |

### Factions (effets alliés si 2+ cartes même faction jouées)

| Faction | Couleur | Spécialité |
|---|---|---|
| Machine Cult | Rouge | Combat, destruction de cartes |
| Star Empire | Bleu | Pioche, force adverse à défausser |
| Trade Federation | Vert | Commerce, récupération d'Autorité |
| Blob | Violet | Combat massif, destruction rangée |

---

## Interface

### Portrait (téléphone vertical)

```
┌─────────────────────┐
│  Cartes adversaire  │  ← main cachée
│  Rangée commerciale │  ← 6 cartes achetables
│  EN JEU / ressources│
│  [Journal] [Fin]    │  ← boutons principaux (44px)
│  MAIN — vos cartes  │
└─────────────────────┘
```

### Paysage (téléphone horizontal)

```
┌──────────────────────────────────┐
│ Main adv │ Rangée  │ Actions     │
│ EN JEU   │ Trade   │ Ressources  │
│ MAIN     │ Bases   │ [Fin du t.] │
└──────────────────────────────────┘
```

### Boutons

| Bouton | Action |
|---|---|
| **JOUER** | Joue la carte depuis la main |
| **Acheter** | Achète la carte de la rangée (coûte du Commerce) |
| **ACTIV.** | Active l'effet d'une base déjà en jeu |
| **Attaquer** | Lance une attaque directe avec tout votre Combat |
| **Fin du tour** | Termine le tour, défausse et pioche 5 |
| **Journal** | Ouvre/ferme le journal des événements |
| **×** | Ferme le journal |
| **Abandonner** | Concède la partie (confirmation requise) |

---

## Choix pendants

Certaines cartes demandent un choix : l'interface affiche un panneau de sélection.
Vous devez résoudre le choix avant de continuer à jouer.

---

## Bot

Le bot joue après un délai de 600ms. Pendant ce délai, les boutons sont désactivés.
Le bot utilise une stratégie **balanced** (commerce et combat équilibrés).

---

## Modes de jeu

| Mode | Description |
|---|---|
| **Contre le Bot** | Vous (Joueur 1) vs bot (Joueur 2) |
| **2 Joueurs** | Deux joueurs sur le même écran (même appareil) |

---

## Glossaire

Bouton **?** dans la barre d'actions pour afficher ce glossaire en jeu.

| Terme | Définition |
|---|---|
| **Main** | Cartes que vous pouvez jouer ce tour. |
| **Pioche** | Votre deck — mélangé à nouveau quand il est vide. |
| **Défausse** | Cartes jouées/achetées ce tour, remélangées en fin de tour suivant. |
| **Écarter** | Retirer définitivement une carte de la partie (ni défausse ni deck). |
| **Défausser** | Mettre une carte dans la défausse. |
| **Effet allié** | Bonus actif si au moins une carte de la même faction a été jouée ce tour. |
| **Base** | Carte permanente — reste en jeu entre les tours. |
| **Avant-poste** | Base avec des points de défense — doit être détruite avant une attaque directe. |
| **Commerce** | Permet d'acheter des cartes dans la rangée commerciale. |
| **Combat** | Permet d'attaquer l'adversaire ou ses bases. |
| **Autorité** | Vos points de vie — tomber à 0 = défaite. |
