# KNOWN_UNCERTAINTIES.md

## Objectif

Lister les points à ne pas laisser être inventés silencieusement pendant le développement.

## Incertitudes fonctionnelles

### Blob World

V0 assumption : défense 7 ; effet `choose_one:gain_combat:5|draw_per_blob_played_this_turn`.

À vérifier avant version non prototype : texte exact et comptage exact des cartes Blob.

### Opponent discard

V0 assumption : l’effet crée un pending choice que le joueur ciblé doit résoudre. Le timing exact peut être affiné ensuite.

### Stealth Needle

V0 assumption : copie les primaryEffects et allyEffects du Ship ciblé ; gagne temporairement la faction copiée ; ne copie pas l’historique d’activation.

### Explorer + topdeck modifier

V0 assumption : Explorer est un Ship acquis ; donc Freighter/Central Office peuvent le placer sur le dessus du deck si le modifier est actif.

### Ally activation

V0 assumption : ally effects automatiques ou pending choice selon leur contenu ; jamais plus d’une fois par tour par carte/effet.

### Dégâts partiels sur Bases

V0 decision : pas de dégâts partiels. Il faut payer toute la défense en une attaque.

## Cartes à vérifier en fin de dev

- Blob World
- Stealth Needle
- Mech World
- Fleet HQ
- Brain World
- Blob Carrier
- Freighter
- Central Office
- Embassy Yacht
- Recycling Station

## Règle

Si une incertitude bloque le développement, implémenter l’hypothèse V0 documentée et ajouter un TODO clair dans le code.
