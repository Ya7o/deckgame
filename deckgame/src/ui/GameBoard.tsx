import { useEffect, useState } from "react";
import type { GameState, CardInstance } from "../game/types";
import { getCardDef } from "../data/cards";
import type { ChoicePayload } from "../game/choices";
import {
  playCard,
  activateBase,
  buyTradeRowCard,
  buyExplorer,
  attackBase,
  attackOpponent,
  activateSelfScrap,
  endTurn,
  concedeGame,
} from "../game/engine";
import { CardView } from "./CardView";
import { CardDetailModal } from "./CardDetailModal";
import { PendingChoicePanel } from "./PendingChoicePanel";
import { GameLog } from "./GameLog";
import { resolvePendingChoice } from "../game/engine";
import { fr } from "../i18n";
import type { GameMode } from "./gameMode";
import { runBotTurn } from "../game/bot";

interface Props {
  initialState: GameState;
  onNewGame: () => void;
  gameMode: GameMode;
}

export function GameBoard({ initialState, onNewGame, gameMode }: Props) {
  const [state, setState] = useState<GameState>(initialState);
  const [selected, setSelected] = useState<CardInstance | null>(null);
  const [showLog, setShowLog] = useState(false);

  // Auto-trigger bot turn in solo mode
  useEffect(() => {
    if (gameMode !== "solo_bot") return;
    if (state.phase === "game_over") return;
    if (state.currentPlayerId !== "player_2") return;
    const timer = setTimeout(() => {
      const result = runBotTurn(state, "player_2");
      setState(result.state);
    }, 600);
    return () => clearTimeout(timer);
  }, [state, gameMode]);

  // In solo mode, the viewer is always the human player regardless of whose turn it is.
  // Without this fix, the UI flips to show the bot's hand/perspective during its turn.
  const viewerId = gameMode === "solo_bot" ? "player_1" : state.currentPlayerId;
  const player = state.players[viewerId];
  const opponent = state.players[viewerId === "player_1" ? "player_2" : "player_1"];
  const isBotTurn = gameMode === "solo_bot" && state.currentPlayerId === "player_2";

  function dispatch(result: ReturnType<typeof playCard>) {
    if (result.ok) {
      setState(result.state);
      setSelected(null);
    } else {
      console.warn("Erreur moteur :", result.error, "—", fr.errors[result.error] ?? result.error);
    }
  }

  function handleCardClick(card: CardInstance) {
    if (state.phase === "game_over") return;
    setSelected(card);
  }

  function handleResolveChoice(choiceId: string, payload: ChoicePayload) {
    dispatch(resolvePendingChoice(state, viewerId, choiceId, payload));
  }

  if (state.phase === "game_over") {
    return <GameOverScreen state={state} onNewGame={onNewGame} />;
  }

  const hasPendingForMe = state.pendingChoices.some(c => c.playerId === viewerId);
  const opponentOutposts = opponent.bases.filter(b => getCardDef(b.definitionId).isOutpost);
  const canAttackDirect = opponentOutposts.length === 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--bg)", overflow: "hidden",
    }}>
      {/* BOT TURN BANNER */}
      {isBotTurn && (
        <div style={{
          padding: "7px 12px",
          background: "#1e1e35",
          borderBottom: "2px solid var(--accent)",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--accent)",
          fontWeight: "bold",
          flexShrink: 0,
          letterSpacing: "0.5px",
        }}>
          {fr.bot.thinkingLabel}
        </div>
      )}

      {/* OPPONENT ZONE */}
      <div style={{
        padding: "8px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: "bold", fontSize: "13px" }}>{opponent.name}</span>
            <span style={{ color: "var(--authority)", fontWeight: "bold" }}>♥ {opponent.authority}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              {fr.ui.deck} {opponent.deck.length} · {fr.ui.discard} {opponent.discard.length} · {fr.ui.hand_short} {opponent.hand.length}
            </span>
          </div>
          {/* Outpost protection badge */}
          {opponentOutposts.length > 0 && (
            <span style={{
              fontSize: "11px", color: "var(--danger)", background: "rgba(255,85,85,0.12)",
              padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(255,85,85,0.3)",
            }}>
              🛡 {opponentOutposts.length} avant-poste{opponentOutposts.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {/* Opponent bases — horizontal scroll */}
        {opponent.bases.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap", paddingBottom: "2px" }}>
              {opponent.bases.map((base) => {
                const def = getCardDef(base.definitionId);
                const canAttack = player.currentCombat >= (def.defense ?? 999) && !hasPendingForMe && !isBotTurn;
                return (
                  <CardView
                    key={base.instanceId}
                    card={base}
                    attackable={canAttack}
                    onClick={() => {
                      if (canAttack) dispatch(attackBase(state, viewerId, base.instanceId));
                      else handleCardClick(base);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TRADE ROW — horizontal scroll */}
      <div style={{
        padding: "8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "#12121a",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>
          {fr.ui.tradeRow}
          <span style={{ marginLeft: "8px", opacity: 0.7 }}>{fr.ui.tradeDeck} {state.tradeDeck.length}</span>
          <span style={{ marginLeft: "6px", opacity: 0.7 }}>· {fr.ui.explorerPile} {state.explorerPile.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "7px", flexWrap: "nowrap", alignItems: "flex-start", paddingBottom: "2px" }}>
            {state.tradeRow.map((card) => {
              const def = getCardDef(card.definitionId);
              const canBuy = player.currentTrade >= (def.cost ?? 999);
              return (
                <div key={card.instanceId} style={{ position: "relative" }}>
                  <CardView
                    card={card}
                    dimmed={!canBuy}
                    onClick={() => {
                      if (canBuy && !hasPendingForMe && !isBotTurn) dispatch(buyTradeRowCard(state, viewerId, card.instanceId));
                      else handleCardClick(card);
                    }}
                  />
                  {canBuy && (
                    <div style={{
                      position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                      fontSize: "9px", background: "var(--trade)", color: "#000",
                      padding: "0 5px", borderRadius: "3px", fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}>{fr.ui.buyBadge}</div>
                  )}
                </div>
              );
            })}
            {/* Explorer pile */}
            {state.explorerPile.length > 0 && (
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "var(--card-w)", height: "var(--card-h)",
                  border: `1px solid ${player.currentTrade >= 2 ? "var(--trade)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: "var(--surface2)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn ? "pointer" : "default",
                  opacity: player.currentTrade >= 2 ? 1 : 0.4,
                  fontSize: "10px", gap: "5px",
                  flexShrink: 0,
                  transition: "opacity 0.1s, border-color 0.1s",
                }}
                  onClick={() => {
                    if (player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn) dispatch(buyExplorer(state, viewerId));
                  }}
                >
                  <div style={{ color: "var(--trade)", fontWeight: "bold", fontSize: "12px" }}>2</div>
                  <div style={{ fontWeight: "bold" }}>{fr.cardNames.explorer}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>×{state.explorerPile.length}</div>
                </div>
                {player.currentTrade >= 2 && (
                  <div style={{
                    position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                    fontSize: "9px", background: "var(--trade)", color: "#000",
                    padding: "0 5px", borderRadius: "3px", fontWeight: "bold",
                  }}>{fr.ui.buyBadge}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IN PLAY — horizontal scroll */}
      <div style={{
        padding: "8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        minHeight: "60px",
        background: "#0d0d14",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
          {fr.ui.inPlay}
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "7px", flexWrap: "nowrap", paddingBottom: "2px" }}>
            {player.inPlay.map((card) => {
              const def = getCardDef(card.definitionId);
              const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
              return (
                <div key={card.instanceId} style={{ position: "relative" }}>
                  <CardView card={card} onClick={() => handleCardClick(card)} />
                  {hasSelfScrap && !hasPendingForMe && !isBotTurn && (
                    <div
                      onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, card.instanceId)); }}
                      style={{
                        position: "absolute", top: "3px", right: "3px",
                        fontSize: "9px", background: "var(--danger)", color: "#fff",
                        padding: "1px 4px", borderRadius: "3px", cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >⊗</div>
                  )}
                </div>
              );
            })}
            {player.bases.map((base) => {
              const def = getCardDef(base.definitionId);
              const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
              return (
                <div key={base.instanceId} style={{ position: "relative" }}>
                  <CardView
                    card={base}
                    onClick={() => {
                      if (!hasPendingForMe && !base.exhausted && !isBotTurn) dispatch(activateBase(state, viewerId, base.instanceId));
                      else handleCardClick(base);
                    }}
                  />
                  {hasSelfScrap && !hasPendingForMe && !isBotTurn && (
                    <div
                      onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, base.instanceId)); }}
                      style={{
                        position: "absolute", top: "3px", right: "3px",
                        fontSize: "9px", background: "var(--danger)", color: "#fff",
                        padding: "1px 4px", borderRadius: "3px", cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >⊗</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RESOURCE + ACTION BAR */}
      <div style={{
        padding: "6px 10px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {/* Resources row */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--authority)", fontWeight: "bold", fontSize: "13px" }}>♥ {player.authority}</span>
          <span style={{ color: "var(--trade)", fontWeight: "bold", fontSize: "13px" }}>{fr.resources.trade} : {player.currentTrade}</span>
          <span style={{ color: "var(--combat)", fontWeight: "bold", fontSize: "13px" }}>⚔ {fr.resources.combat} : {player.currentCombat}</span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            {fr.ui.deck} {player.deck.length} · {fr.ui.discard} {player.discard.length}
          </span>
        </div>
        {/* Actions row */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {canAttackDirect && player.currentCombat > 0 && !hasPendingForMe && !isBotTurn && (
            <button
              className="danger"
              onClick={() => dispatch(attackOpponent(state, viewerId, player.currentCombat))}
              style={{ minHeight: "34px", padding: "4px 10px", fontSize: "12px" }}
            >
              ⚔ {fr.actions.attack} ({player.currentCombat})
            </button>
          )}
          {!canAttackDirect && player.currentCombat > 0 && !isBotTurn && (
            <span style={{
              fontSize: "11px", color: "var(--danger)", background: "rgba(255,85,85,0.1)",
              padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(255,85,85,0.25)",
            }}>
              Avant-poste bloque l&apos;attaque directe
            </span>
          )}
          <button
            onClick={() => setShowLog(!showLog)}
            style={{ minHeight: "34px", padding: "4px 8px", fontSize: "11px" }}
          >
            {fr.actions.log}
          </button>
          <button
            className="danger"
            onClick={() => { if (confirm(`${fr.actions.concede} ?`)) dispatch(concedeGame(state, viewerId)); }}
            style={{ minHeight: "34px", padding: "4px 8px", fontSize: "11px" }}
          >
            {fr.actions.concede}
          </button>
          <button
            className="primary"
            disabled={hasPendingForMe || isBotTurn}
            onClick={() => dispatch(endTurn(state, viewerId))}
            style={{ minHeight: "34px", padding: "4px 12px" }}
          >
            {fr.actions.endTurn}
          </button>
        </div>
      </div>

      {/* HAND */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        background: "var(--bg)",
        minHeight: 0,
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px", flexShrink: 0 }}>
          {fr.ui.hand} — {player.name} ({fr.ui.turn} {state.turnNumber})
        </div>
        <div style={{ overflowX: "auto", flex: 1, display: "flex", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "7px", flexWrap: "nowrap", paddingBottom: "env(safe-area-inset-bottom, 4px)" }}>
            {player.hand.map((card) => (
              <CardView
                key={card.instanceId}
                card={card}
                playable={!hasPendingForMe && !isBotTurn}
                onClick={() => {
                  if (!hasPendingForMe && !isBotTurn) dispatch(playCard(state, viewerId, card.instanceId));
                  else handleCardClick(card);
                }}
              />
            ))}
            {player.hand.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "16px 0" }}>
                {fr.ui.handEmpty}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GAME LOG */}
      {showLog && (
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <GameLog entries={state.log} />
        </div>
      )}

      {/* OVERLAYS */}
      <PendingChoicePanel state={state} viewerId={viewerId} onResolve={handleResolveChoice} />

      {selected && (
        <CardDetailModal
          card={selected}
          state={state}
          onClose={() => setSelected(null)}
          onPlay={
            player.hand.includes(selected) && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(playCard(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onBuy={
            state.tradeRow.includes(selected) && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(buyTradeRowCard(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onActivate={
            player.bases.includes(selected) && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(activateBase(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onSelfScrap={
            (player.inPlay.includes(selected) || player.bases.includes(selected)) && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(activateSelfScrap(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onAttackBase={
            opponent.bases.includes(selected) && player.currentCombat >= (getCardDef(selected.definitionId).defense ?? 999) && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(attackBase(state, viewerId, selected.instanceId)); }
              : undefined
          }
        />
      )}
    </div>
  );
}

function GameOverScreen({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const winner = state.winner ? state.players[state.winner] : null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: "16px", padding: "24px",
      paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
    }}>
      <div style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "1px" }}>{fr.ui.gameOver}</div>
      {winner && <div style={{ color: "var(--success)", fontSize: "18px" }}>{fr.ui.winner} : {winner.name}</div>}
      <div style={{ color: "var(--text-muted)" }}>
        {state.gameOverReason === "concede" ? fr.ui.concessionReason : fr.ui.depletionReason}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button className="primary" onClick={onNewGame}>{fr.actions.newGame}</button>
      </div>
      <div style={{ maxWidth: "420px", width: "100%", padding: "0 4px" }}>
        <GameLog entries={state.log} maxHeight={220} />
      </div>
    </div>
  );
}
