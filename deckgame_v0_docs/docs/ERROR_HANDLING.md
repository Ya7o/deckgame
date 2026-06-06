# ERROR_HANDLING.md

## Principe

Une action illégale ne doit jamais modifier le GameState.

## Format

```ts
type EngineError = {
  code: EngineErrorCode;
  message: string;
  details?: Record<string, unknown>;
};
```

## Codes

| Code | Situation | Message utilisateur |
|---|---|---|
| GAME_ALREADY_OVER | action après fin | Game is already over. |
| NOT_CURRENT_PLAYER | mauvais joueur | It is not this player’s turn. |
| INVALID_PHASE | phase non compatible | This action is not allowed now. |
| PENDING_CHOICE_EXISTS | choix non résolu | Resolve the pending choice first. |
| CARD_NOT_FOUND | instance introuvable | Card not found. |
| CARD_NOT_IN_HAND | play impossible | Card is not in hand. |
| CARD_NOT_IN_TRADE_ROW | achat impossible | Card is not in Trade Row. |
| CARD_NOT_A_BASE | cible invalide | Target is not a Base. |
| CARD_NOT_A_SHIP | cible invalide | Target is not a Ship. |
| CARD_ALREADY_EXHAUSTED | Base déjà utilisée | This Base has already been used this turn. |
| NOT_ENOUGH_TRADE | achat impossible | Not enough Trade. |
| NOT_ENOUGH_COMBAT | attaque impossible | Not enough Combat. |
| OUTPOST_BLOCKING | attaque directe bloquée | Opponent has an Outpost. |
| INVALID_TARGET | cible invalide | Invalid target. |
| INVALID_CHOICE | résolution invalide | Invalid choice. |
| EMPTY_EXPLORER_PILE | achat Explorer impossible | Explorer pile is empty. |
| NO_AVAILABLE_TARGET | choix sans cible | No available target. |
| ACTION_NOT_ALLOWED | fallback | Action not allowed. |

## Règle UI

L’UI peut désactiver les boutons illégaux, mais le moteur doit quand même valider et refuser proprement.
