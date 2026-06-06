import { describe, it, expect } from "vitest";
import { fr, getCardNameFr, renderEffectFr } from "../i18n";
import { CARD_DEFINITIONS } from "../data/cards";
import type { EngineError } from "../game/types";

describe("i18n — traductions françaises (PATCH 0008)", () => {

  it("toutes les cartes ont un nom français affichable", () => {
    for (const def of CARD_DEFINITIONS) {
      const name = getCardNameFr(def.id);
      expect(name).toBeTruthy();
      expect(name).not.toBe(def.id); // le nom ne doit pas être juste l'ID technique
    }
  });

  it("les ressources principales sont traduites", () => {
    expect(fr.resources.authority).toBe("Autorité");
    expect(fr.resources.trade).toBe("Commerce");
    expect(fr.resources.combat).toBe("Combat");
  });

  it("les actions principales sont traduites", () => {
    expect(fr.actions.play).toBe("Jouer");
    expect(fr.actions.buy).toBe("Acheter");
    expect(fr.actions.endTurn).toBe("Fin du tour");
    expect(fr.actions.skip).toBe("Ignorer");
    expect(fr.actions.close).toBe("Fermer");
    expect(fr.actions.newGame).toBe("Nouvelle partie");
  });

  it("les zones sont traduites", () => {
    expect(fr.zones.deck).toBe("Pioche");
    expect(fr.zones.hand).toBe("Main");
    expect(fr.zones.discard).toBe("Défausse");
    expect(fr.zones.scrap_heap).toBe("Écart");
    expect(fr.zones.trade_row).toBe("Rangée commerciale");
  });

  it("renderEffectFr — gain_trade devient +X Commerce", () => {
    const result = renderEffectFr({ type: "gain_trade", amount: 3 });
    expect(result).toBe("+3 Commerce");
  });

  it("renderEffectFr — gain_combat devient +X Combat", () => {
    const result = renderEffectFr({ type: "gain_combat", amount: 5 });
    expect(result).toBe("+5 Combat");
  });

  it("renderEffectFr — draw devient Piochez X carte(s)", () => {
    const single = renderEffectFr({ type: "draw", amount: 1 });
    expect(single).toBe("Piochez 1 carte");
    const plural = renderEffectFr({ type: "draw", amount: 2 });
    expect(plural).toBe("Piochez 2 cartes");
  });

  it("renderEffectFr — gain_authority", () => {
    const result = renderEffectFr({ type: "gain_authority", amount: 2 });
    expect(result).toBe("+2 Autorité");
  });

  it("renderEffectFr — opponent_discard", () => {
    const result = renderEffectFr({ type: "opponent_discard", amount: 1 });
    expect(result).toContain("défausse");
  });

  it("message d'erreur insufficient_trade est traduit", () => {
    const msg = fr.errors["insufficient_trade" as EngineError];
    expect(msg).toBe("Commerce insuffisant.");
  });

  it("message d'erreur outpost_blocking est traduit", () => {
    const msg = fr.errors["outpost_blocking" as EngineError];
    expect(msg).toContain("avant-poste");
  });

  it("tous les codes d'erreur EngineError ont une traduction", () => {
    const errorCodes: EngineError[] = [
      "not_your_turn", "wrong_phase", "card_not_in_hand", "card_not_in_bases",
      "base_already_exhausted", "insufficient_trade", "insufficient_combat",
      "explorer_pile_empty", "outpost_blocking", "card_not_in_trade_row",
      "pending_choices_unresolved", "invalid_choice", "invalid_target",
      "game_already_over", "base_not_found", "no_ships_to_copy", "invalid_amount",
    ];
    for (const code of errorCodes) {
      expect(fr.errors[code]).toBeTruthy();
    }
  });

  it("les noms de cartes emblématiques sont corrects", () => {
    expect(getCardNameFr("scout")).toBe("Éclaireur");
    expect(getCardNameFr("viper")).toBe("Vipère");
    expect(getCardNameFr("explorer")).toBe("Explorateur");
    expect(getCardNameFr("blob_fighter")).toBe("Chasseur Blob");
    expect(getCardNameFr("stealth_needle")).toBe("Aiguille Furtive");
    expect(getCardNameFr("fleet_hq")).toBe("QG de la Flotte");
    expect(getCardNameFr("brain_world")).toBe("Monde Cerveau");
  });

  it("getCardNameFr retourne l'ID en fallback pour une carte inconnue", () => {
    const result = getCardNameFr("unknown_card_xyz");
    expect(result).toBe("unknown_card_xyz");
  });
});
