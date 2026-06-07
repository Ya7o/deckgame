# Screenshots — PATCH 0017

Les captures automatiques sont indisponibles dans cet environnement :
- `preview_screenshot` (Preview MCP) depasse le timeout 30s avec le serveur WSL.
- `npx playwright install chromium` echoue : Ubuntu 26.04 non supporte.

## Verifications equivalentes

Toutes les assertions visuelles critiques ont ete verifiees via `preview_eval`
(JavaScript execute dans la page) avec le viewport mobile 375x812 :

| Assertion | Methode | Resultat |
|---|---|---|
| Viewport 375x812 | `window.innerWidth/innerHeight` | OK |
| MAIN = Joueur 1 | `innerText.match(/MAIN.*/)` | OK |
| JOUER buttons = 5 | `querySelectorAll("button")` | OK |
| Aucun bouton JOUER pendant tour bot | poll 150ms | OK |
| Modal ouvre sur tap carte | `querySelectorAll('[style*=fixed]')` | OK |
| Fin du tour bloquee pendant bot | `button.disabled` | OK |

Voir details complets dans `reports/patch-0017/review.md` section 5.
