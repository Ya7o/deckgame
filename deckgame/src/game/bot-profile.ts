import type { GameState, PlayerId, CardInstance } from "./types";
import { getCardDef } from "../data/cards";

// ---------------------------------------------------------------------------
// PATCH 0021 — Profils bot configurables
// ---------------------------------------------------------------------------

export type BotProfileId = "balanced" | "aggressive" | "economy" | "defensive";

export type BotProfile = {
  id: BotProfileId;
  description: string;
  /** "cost_first" : achète la carte la plus chère abordable (comportement original)
   *  "efficiency" : achète selon le score coût/efficacité pondéré par le profil */
  buyStrategy: "cost_first" | "efficiency";
  /** Préférence d'achat : fraction [0,1] accordée au score combat d'une carte */
  combatWeight: number;
  /** Préférence d'achat : fraction [0,1] accordée au score trade d'une carte */
  tradeWeight: number;
  /** Préférence d'achat : fraction [0,1] accordée à la défense (bases/avant-postes) */
  defenseWeight: number;
  /** Si true : attaque le joueur adversaire dès que les avant-postes sont détruits */
  preferDirectAttack: boolean;
  /** Si true : préfère piocher / détruire les avant-postes en premier */
  preferOutpostFirst: boolean;
  /** Multiplicateur [0,1] sur le seuil minimal de combat pour attaquer directement */
  aggressionThreshold: number;
};

// ---------------------------------------------------------------------------
// Définitions des profils
// ---------------------------------------------------------------------------

export const BOT_PROFILES: Record<BotProfileId, BotProfile> = {
  /** balanced : reproduit le comportement pré-PATCH 0021 */
  balanced: {
    id: "balanced",
    description: "Équilibré — reproduit le comportement original du bot",
    buyStrategy: "cost_first",
    combatWeight: 0.5,
    tradeWeight: 0.5,
    defenseWeight: 0.3,
    preferDirectAttack: false,
    preferOutpostFirst: true,
    aggressionThreshold: 1.0,
  },
  /** aggressive : maximise combat, attaque tôt */
  aggressive: {
    id: "aggressive",
    description: "Agressif — priorise combat et attaque directe",
    buyStrategy: "efficiency",
    combatWeight: 0.8,
    tradeWeight: 0.2,
    defenseWeight: 0.1,
    preferDirectAttack: true,
    preferOutpostFirst: false,
    aggressionThreshold: 0.6,
  },
  /** economy : maximise trade, achète les cartes les plus chères */
  economy: {
    id: "economy",
    description: "Économique — accumule du commerce pour des cartes puissantes",
    buyStrategy: "efficiency",
    combatWeight: 0.2,
    tradeWeight: 0.8,
    defenseWeight: 0.2,
    preferDirectAttack: false,
    preferOutpostFirst: true,
    aggressionThreshold: 1.0,
  },
  /** defensive : priorise bases et avant-postes */
  defensive: {
    id: "defensive",
    description: "Défensif — construit des bases, protège son autorité",
    buyStrategy: "efficiency",
    combatWeight: 0.3,
    tradeWeight: 0.4,
    defenseWeight: 0.8,
    preferDirectAttack: false,
    preferOutpostFirst: true,
    aggressionThreshold: 1.2,
  },
};

export const DEFAULT_PROFILE: BotProfile = BOT_PROFILES.balanced;

// ---------------------------------------------------------------------------
// Score d'une carte pour l'achat selon le profil
// ---------------------------------------------------------------------------

export function cardBuyScore(card: CardInstance, profile: BotProfile): number {
  const def = getCardDef(card.definitionId);
  const cost = def.cost ?? 0;

  // Contribution combat primaire
  let combatScore = 0;
  let tradeScore = 0;
  let defenseScore = 0;

  for (const e of def.primaryEffects) {
    if (e.type === "gain_combat") combatScore += e.amount;
    if (e.type === "gain_trade") tradeScore += e.amount;
    if (e.type === "gain_authority") tradeScore += e.amount * 0.5;
  }
  for (const ae of def.allyEffects) {
    for (const e of ae.effects) {
      if (e.type === "gain_combat") combatScore += e.amount * 0.4;
      if (e.type === "gain_trade") tradeScore += e.amount * 0.4;
    }
  }
  if (def.type === "base") {
    defenseScore += (def.defense ?? 0) * 0.3;
    if (def.isOutpost) defenseScore += 2;
  }

  const rawScore =
    combatScore * profile.combatWeight +
    tradeScore * profile.tradeWeight +
    defenseScore * profile.defenseWeight;

  // Normalise par le coût pour comparer l'efficacité
  return cost > 0 ? rawScore / cost : rawScore;
}

// ---------------------------------------------------------------------------
// Choix du meilleur achat selon le profil
// ---------------------------------------------------------------------------

export function chooseBestBuy(
  state: GameState,
  playerId: PlayerId,
  profile: BotProfile
): CardInstance | null {
  const trade = state.players[playerId].currentTrade;
  if (trade <= 0) return null;

  const affordable = state.tradeRow.filter(
    (c) => (getCardDef(c.definitionId).cost ?? 999) <= trade
  );
  if (affordable.length === 0) return null;

  if (profile.buyStrategy === "cost_first") {
    // Comportement original : carte la plus chère abordable
    return affordable.reduce((best, c) =>
      (getCardDef(c.definitionId).cost ?? 0) > (getCardDef(best.definitionId).cost ?? 0) ? c : best
    );
  }

  // Stratégie efficacité : trie par score pondéré / coût
  const scored = affordable
    .map((c) => ({ card: c, score: cardBuyScore(c, profile) }))
    .sort((a, b) => b.score - a.score);

  return scored[0].card;
}

// ---------------------------------------------------------------------------
// Choix d'attaque selon le profil
// ---------------------------------------------------------------------------

export function chooseAttackTarget(
  state: GameState,
  playerId: PlayerId,
  profile: BotProfile
): { type: "base"; instanceId: string } | { type: "opponent"; amount: number } | null {
  const combat = state.players[playerId].currentCombat;
  if (combat <= 0) return null;

  const opponent = state.players[state.opponentPlayerId];

  // Avant-postes destructibles
  const destroyableOutposts = opponent.bases
    .filter((b) => getCardDef(b.definitionId).isOutpost)
    .filter((b) => (getCardDef(b.definitionId).defense ?? 999) <= combat);

  // Bases non-avant-poste destructibles
  const destroyableOthers = opponent.bases
    .filter((b) => !getCardDef(b.definitionId).isOutpost)
    .filter((b) => (getCardDef(b.definitionId).defense ?? 999) <= combat);

  const hasOutpost = opponent.bases.some((b) => getCardDef(b.definitionId).isOutpost);

  // Si aggressive : direct attack dès que possible (pas d'outpost adverse)
  if (profile.preferDirectAttack && !hasOutpost) {
    return { type: "opponent", amount: combat };
  }

  // Si preferOutpostFirst : détruire les avant-postes en premier
  if (profile.preferOutpostFirst && destroyableOutposts.length > 0) {
    const weakest = destroyableOutposts.reduce((a, b) =>
      (getCardDef(a.definitionId).defense ?? 999) <= (getCardDef(b.definitionId).defense ?? 999) ? a : b
    );
    return { type: "base", instanceId: weakest.instanceId };
  }

  // Pas d'avant-poste adverse ou aggressive : attaque directe si seuil atteint
  if (!hasOutpost) {
    const threshold = state.players[state.opponentPlayerId].authority * profile.aggressionThreshold;
    if (combat >= threshold || profile.preferDirectAttack) {
      return { type: "opponent", amount: combat };
    }
  }

  // Sinon : détruire une base adverse (la plus forte d'abord, max valeur)
  const allDestroyable = [...destroyableOutposts, ...destroyableOthers].sort(
    (a, b) => (getCardDef(b.definitionId).defense ?? 0) - (getCardDef(a.definitionId).defense ?? 0)
  );
  if (allDestroyable.length > 0) {
    return { type: "base", instanceId: allDestroyable[0].instanceId };
  }

  // Attaque directe résiduelle si pas d'avant-poste
  if (!hasOutpost && combat > 0) {
    return { type: "opponent", amount: combat };
  }

  return null;
}
