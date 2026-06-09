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
import { useOrientation } from "../hooks/useOrientation";
import { useFullscreen } from "../hooks/useFullscreen";

interface Props {
  initialState: GameState;
  onNewGame: () => void;
  gameMode: GameMode;
}

export function GameBoard({ initialState, onNewGame, gameMode }: Props) {
  const [state, setState] = useState<GameState>(initialState);
  const [selected, setSelected] = useState<CardInstance | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

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
  const orientation = useOrientation();
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

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

  // Résumé du dernier tour bot (affiché pendant le tour humain suivant)
  const lastBotActions: string[] = (() => {
    if (gameMode !== "solo_bot") return [];
    if (state.currentPlayerId !== "player_1") return [];
    const botTurn = state.turnNumber - 1;
    if (botTurn < 1) return [];
    return state.log
      .filter(e => e.playerId === "player_2" && e.turn === botTurn)
      .map(e => e.message)
      .filter(m => m !== "Fin du tour." && m !== "Pioche pour le prochain tour.");
  })();

  function formatBotAction(msg: string): string {
    if (msg.startsWith("Joue ")) return `Bot joue ${msg.slice(5, -1)}`;
    if (msg.startsWith("Achète ")) return `Bot achète ${msg.slice(7, -1)}`;
    if (msg.startsWith("Attaque ")) return `Bot attaque ${msg.slice(8, -1)}`;
    if (msg.startsWith("Détruit ")) return `Bot détruit ${msg.slice(8, -1)}`;
    if (msg.startsWith("Active ")) return `Bot active ${msg.slice(7, -1)}`;
    if (msg.startsWith("Écarte ")) return `Bot écarte ${msg.slice(7, -1)}`;
    return msg;
  }

  // ═══ LANDSCAPE LAYOUT ═══
  if (orientation === "landscape") {
    return (
      <div
        data-layout="landscape"
        style={{
          display: "flex", flexDirection: "column", height: "100%",
          background: "var(--bg)", overflow: "hidden", position: "relative",
        }}
      >
        {/* LANDSCAPE — Bot banner compact */}
        {isBotTurn && (
          <div style={{
            padding: "5px 12px",
            background: "#191730",
            borderBottom: "2px solid var(--accent)",
            textAlign: "center",
            fontSize: "12px", color: "var(--accent)", fontWeight: "bold",
            flexShrink: 0, letterSpacing: "0.5px",
          }}>
            ⏳ {fr.bot.thinkingLabel}
          </div>
        )}

        {/* LANDSCAPE — Opponent zone (compact row) */}
        <div style={{
          padding: "3px 10px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "nowrap",
          overflowX: "auto",
        }}>
          <span style={{ fontWeight: "bold", fontSize: "12px", flexShrink: 0 }}>{opponent.name}</span>
          <span style={{ color: "var(--authority)", fontWeight: "bold", fontSize: "12px", flexShrink: 0 }}>
            ♥ {opponent.authority}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "10px", flexShrink: 0 }}>
            {fr.ui.deck} {opponent.deck.length} · {fr.ui.discard} {opponent.discard.length} · {fr.ui.hand_short} {opponent.hand.length}
          </span>
          {opponentOutposts.length > 0 && (
            <span style={{
              fontSize: "10px", color: "var(--danger)", background: "rgba(255,85,85,0.12)",
              padding: "1px 5px", borderRadius: "4px", border: "1px solid rgba(255,85,85,0.3)",
              flexShrink: 0,
            }}>
              🛡 {opponentOutposts.length} avant-poste{opponentOutposts.length > 1 ? "s" : ""}
            </span>
          )}
          {opponent.bases.map((base) => {
            const def = getCardDef(base.definitionId);
            const canAttack = player.currentCombat >= (def.defense ?? 999) && !hasPendingForMe && !isBotTurn;
            return (
              <div key={base.instanceId} style={{ "--card-w": "52px", "--card-h": "40px" } as React.CSSProperties}>
                <CardView
                  card={base} attackable={canAttack}
                  onClick={() => { if (canAttack) dispatch(attackBase(state, viewerId, base.instanceId)); else handleCardClick(base); }}
                />
              </div>
            );
          })}
        </div>

        {/* LANDSCAPE — Bot last actions summary */}
        {lastBotActions.length > 0 && (
          <div style={{
            padding: "3px 10px",
            background: "#16152a",
            borderBottom: "1px solid var(--accent)",
            fontSize: "10px",
            color: "var(--text-muted)",
            flexShrink: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}>
            <span style={{ color: "var(--accent)", fontWeight: "bold", marginRight: "6px" }}>✦</span>
            {lastBotActions.map(formatBotAction).join(" · ")}
          </div>
        )}

        {/* LANDSCAPE — Trade row */}
        <div style={{
          padding: "3px 8px 2px 8px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0, background: "#12121a", position: "relative",
        }}>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "1px" }}>
            {fr.ui.tradeRow}
            <span style={{ marginLeft: "6px", opacity: 0.7 }}>{fr.ui.tradeDeck} {state.tradeDeck.length} · {fr.ui.explorerPile} {state.explorerPile.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: "5px", flexWrap: "nowrap", alignItems: "flex-start", paddingBottom: "2px" }}>
              {state.tradeRow.map((card) => {
                const def = getCardDef(card.definitionId);
                const canBuy = player.currentTrade >= (def.cost ?? 999);
                return (
                  <div key={card.instanceId} style={{ position: "relative" }}>
                    <CardView card={card} dimmed={!canBuy} onClick={() => handleCardClick(card)} />
                    {canBuy && !hasPendingForMe && !isBotTurn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(buyTradeRowCard(state, viewerId, card.instanceId)); }}
                        style={{
                          position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                          fontSize: "8px", background: "var(--trade)", color: "#000",
                          padding: "0 4px", borderRadius: "3px", fontWeight: "bold",
                          border: "none", cursor: "pointer", whiteSpace: "nowrap", minHeight: "auto",
                        }}
                      >{fr.ui.buyBadge}</button>
                    )}
                  </div>
                );
              })}
              {state.explorerPile.length > 0 && (
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "var(--card-w)", height: "var(--card-h)",
                      border: `1px solid ${player.currentTrade >= 2 ? "var(--trade)" : "var(--border)"}`,
                      borderRadius: "var(--radius)", background: "var(--surface2)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", opacity: player.currentTrade >= 2 ? 1 : 0.4,
                      fontSize: "9px", gap: "3px", flexShrink: 0,
                    }}
                    onClick={() => handleCardClick(state.explorerPile[0])}
                  >
                    <div style={{ color: "var(--trade)", fontWeight: "bold", fontSize: "10px" }}>2</div>
                    <div style={{ fontWeight: "bold", fontSize: "9px" }}>{fr.cardNames.explorer}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "8px" }}>×{state.explorerPile.length}</div>
                  </div>
                  {player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(buyExplorer(state, viewerId)); }}
                      style={{
                        position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                        fontSize: "8px", background: "var(--trade)", color: "#000",
                        padding: "0 4px", borderRadius: "3px", fontWeight: "bold",
                        border: "none", cursor: "pointer", whiteSpace: "nowrap", minHeight: "auto",
                      }}
                    >{fr.ui.buyBadge}</button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "36px",
            background: "linear-gradient(to right, transparent, #12121a)",
            pointerEvents: "none", zIndex: 1,
          }} />
        </div>

        {/* LANDSCAPE — Middle: EN JEU + Resources + Actions */}
        <div style={{ display: "flex", flexDirection: "row", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "#0d0d14" }}>
          {/* Left: EN JEU micro */}
          <div style={{ flex: 1, padding: "3px 6px", overflowX: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "1px", flexShrink: 0 }}>{fr.ui.inPlay}</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap", alignItems: "flex-start" }}>
              {(player.inPlay.length > 0 || player.bases.length > 0) ? (
                <>
                  {player.inPlay.map((card) => {
                    const def = getCardDef(card.definitionId);
                    const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
                    return (
                      <div key={card.instanceId} style={{ position: "relative", "--card-w": "52px", "--card-h": "56px" } as React.CSSProperties}>
                        <CardView card={card} onClick={() => handleCardClick(card)} />
                        {hasSelfScrap && !hasPendingForMe && !isBotTurn && (
                          <div onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, card.instanceId)); }}
                            style={{ position: "absolute", top: "2px", right: "2px", fontSize: "7px", background: "var(--danger)", color: "#fff", padding: "0 2px", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}>
                            ⊗
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {player.bases.map((base) => {
                    const def = getCardDef(base.definitionId);
                    const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
                    return (
                      <div key={base.instanceId} style={{ position: "relative", "--card-w": "52px", "--card-h": "56px" } as React.CSSProperties}>
                        <CardView card={base} onClick={() => handleCardClick(base)} />
                        {hasSelfScrap && !hasPendingForMe && !isBotTurn && (
                          <div onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, base.instanceId)); }}
                            style={{ position: "absolute", top: "2px", right: "2px", fontSize: "7px", background: "var(--danger)", color: "#fff", padding: "0 2px", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}>
                            ⊗
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ fontSize: "9px", color: "var(--text-muted)", opacity: 0.4, fontStyle: "italic", paddingTop: "2px" }}>
                  {fr.ui.inPlayEmpty}
                </div>
              )}
            </div>
          </div>

          <div style={{ width: "1px", background: "var(--border)", alignSelf: "stretch" }} />

          {/* Right: Resources + Actions */}
          <div style={{ flexShrink: 0, padding: "3px 8px", display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--authority)", fontWeight: "bold", fontSize: "11px" }}>♥ {player.authority}</span>
              <span style={{ color: "var(--trade)", fontWeight: "bold", fontSize: "11px" }}>{fr.resources.trade}: {player.currentTrade}</span>
              <span style={{ color: "var(--combat)", fontWeight: "bold", fontSize: "11px" }}>⚔ {player.currentCombat}</span>

            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
              <button className="primary" disabled={hasPendingForMe || isBotTurn}
                title={hasPendingForMe ? fr.ui.endTurnTitlePending : isBotTurn ? fr.ui.endTurnTitleBot : undefined}
                onClick={() => dispatch(endTurn(state, viewerId))}
                style={{ minHeight: "36px", padding: "2px 10px", fontSize: "11px", fontWeight: "bold" }}>
                {fr.actions.endTurn}
              </button>
              <button onClick={() => setShowLog(!showLog)} style={{ minHeight: "36px", padding: "2px 8px", fontSize: "10px" }}>
                {fr.actions.log}
              </button>
              {canAttackDirect && player.currentCombat > 0 && !hasPendingForMe && !isBotTurn && (
                <button className="danger"
                  onClick={() => dispatch(attackOpponent(state, viewerId, player.currentCombat))}
                  style={{ minHeight: "36px", padding: "2px 8px", fontSize: "11px" }}>
                  ⚔ {fr.actions.attack} ({player.currentCombat})
                </button>
              )}
              {!canAttackDirect && player.currentCombat > 0 && !isBotTurn && (
                <span style={{ fontSize: "9px", color: "var(--danger)", background: "rgba(255,85,85,0.1)", padding: "2px 5px", borderRadius: "4px", border: "1px solid rgba(255,85,85,0.25)" }}>
                  {fr.ui.outpostBlockLandscape}
                </span>
              )}
              <button
                onClick={() => { if (confirm(fr.actions.concede + " ?")) dispatch(concedeGame(state, viewerId)); }}
                style={{ fontSize: "9px", color: "var(--text-muted)", padding: "1px 5px", minHeight: "18px", background: "transparent", border: "1px solid rgba(255,85,85,0.25)", opacity: 0.8 }}>
                {fr.actions.concede}
              </button>
              {isFullscreenSupported && (
                <button
                  aria-label={isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
                  onClick={toggleFullscreen}
                  style={{ fontSize: "9px", color: "var(--text-muted)", padding: "1px 5px", minHeight: "18px", background: "transparent", border: "1px solid var(--border)", opacity: 0.7 }}>
                  {isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
                </button>
              )}
              <button
                aria-label={fr.ui.glossaryTitle}
                onClick={() => setShowGlossary(true)}
                style={{ fontSize: "9px", color: "var(--text-muted)", padding: "1px 5px", minHeight: "18px", background: "transparent", border: "1px solid var(--border)", opacity: 0.7 }}>
                {fr.ui.glossaryBtn}
              </button>
            </div>
          </div>
        </div>

        {/* LANDSCAPE — HAND (bottom, always visible) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "3px 8px", paddingBottom: "calc(3px + env(safe-area-inset-bottom, 0px))", background: "var(--bg)", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px", flexShrink: 0 }}>
            {fr.ui.hand} — {player.name} ({fr.ui.turn} {state.turnNumber})
            {player.hand.length > 0 && (
              <span style={{ marginLeft: "5px", opacity: 0.7 }}>
                · {player.hand.length} carte{player.hand.length > 1 ? "s" : ""}
              </span>
            )}
            <span style={{ marginLeft: "6px", opacity: 0.5, fontSize: "9px" }}>
              {fr.ui.deck} {player.deck.length} · {fr.ui.discard} {player.discard.length}
            </span>
          </div>
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            <div style={{ overflowX: "auto", height: "100%", ...(isBotTurn ? { filter: "grayscale(40%)", opacity: 0.7 } : {}) }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap", paddingBottom: "4px", alignItems: "flex-start" }}>
                {player.hand.map((card) => (
                  <div key={card.instanceId} style={{ position: "relative" }}>
                    <CardView card={card} playable={!hasPendingForMe && !isBotTurn} onClick={() => handleCardClick(card)} />
                    {!hasPendingForMe && !isBotTurn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(playCard(state, viewerId, card.instanceId)); }}
                        style={{ position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)", fontSize: "8px", background: "var(--accent)", color: "#fff", padding: "0 4px", borderRadius: "3px", fontWeight: "bold", border: "none", cursor: "pointer", whiteSpace: "nowrap", minHeight: "auto" }}>
                        {fr.ui.playBadge}
                      </button>
                    )}
                  </div>
                ))}
                {player.hand.length === 0 && (
                  <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "10px 4px", fontStyle: "italic" }}>
                    {fr.ui.handEmpty}
                  </div>
                )}
              </div>
            </div>
            {player.hand.length > 0 && !isBotTurn && (
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "30px", background: "linear-gradient(to right, transparent, var(--bg))", pointerEvents: "none", zIndex: 1 }} />
            )}
            {isBotTurn && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.60)", pointerEvents: "none", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>{fr.bot.turnLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* LANDSCAPE — Journal overlay */}
        {showLog && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50, borderTop: "2px solid var(--border)", background: "var(--surface)", padding: "6px 8px", maxHeight: "45%", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>Journal</span>
              <button aria-label="Fermer le journal" onClick={() => setShowLog(false)} style={{ minWidth: "44px", minHeight: "44px", padding: "0", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <GameLog entries={state.log} maxHeight={120} />
          </div>
        )}

        {/* Shared overlays */}
        <PendingChoicePanel state={state} viewerId={viewerId} onResolve={handleResolveChoice} />
        {selected && (
          <CardDetailModal
            card={selected} state={state}
            onClose={() => setSelected(null)}
            onPlay={player.hand.includes(selected) && !hasPendingForMe && !isBotTurn ? () => { dispatch(playCard(state, viewerId, selected.instanceId)); setSelected(null); } : undefined}
            onBuy={
              state.tradeRow.includes(selected) && player.currentTrade >= (getCardDef(selected.definitionId).cost ?? 999) && !hasPendingForMe && !isBotTurn
                ? () => { dispatch(buyTradeRowCard(state, viewerId, selected.instanceId)); setSelected(null); }
                : state.explorerPile.includes(selected) && player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn
                ? () => { dispatch(buyExplorer(state, viewerId)); setSelected(null); }
                : undefined
            }
            onActivate={player.bases.includes(selected) && !selected.exhausted && !hasPendingForMe && !isBotTurn ? () => { dispatch(activateBase(state, viewerId, selected.instanceId)); } : undefined}
            onSelfScrap={(player.inPlay.includes(selected) || player.bases.includes(selected)) && !hasPendingForMe && !isBotTurn ? () => { dispatch(activateSelfScrap(state, viewerId, selected.instanceId)); } : undefined}
            onAttackBase={opponent.bases.includes(selected) && player.currentCombat >= (getCardDef(selected.definitionId).defense ?? 999) && !hasPendingForMe && !isBotTurn ? () => { dispatch(attackBase(state, viewerId, selected.instanceId)); } : undefined}
          />
        )}
        {showGlossary && (
          <div onClick={() => setShowGlossary(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", width: "100%", maxWidth: "500px", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px" }}>{fr.ui.glossaryTitle}</span>
                <button onClick={() => setShowGlossary(false)} style={{ minWidth: "44px", minHeight: "44px", padding: "0", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              {fr.glossary.map(({ term, definition }) => (
                <div key={term} style={{ marginBottom: "10px" }}>
                  <span style={{ fontWeight: "bold", color: "var(--accent)" }}>{term}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "8px", fontSize: "13px" }}>{definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-layout={orientation}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: "var(--bg)", overflow: "hidden",
      }}
    >
      {/* BOT TURN BANNER */}
      {isBotTurn && (
        <div style={{
          padding: "10px 16px",
          background: "#191730",
          borderBottom: "2px solid var(--accent)",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--accent)",
          fontWeight: "bold",
          flexShrink: 0,
          letterSpacing: "0.5px",
        }}>
          ⏳ {fr.bot.thinkingLabel}
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
        position: "relative",
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
                    onClick={() => handleCardClick(card)}
                  />
                  {canBuy && !hasPendingForMe && !isBotTurn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(buyTradeRowCard(state, viewerId, card.instanceId)); }}
                      style={{
                        position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                        fontSize: "9px", background: "var(--trade)", color: "#000",
                        padding: "0 5px", borderRadius: "3px", fontWeight: "bold",
                        border: "none", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >{fr.ui.buyBadge}</button>
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
                  cursor: "pointer",
                  opacity: player.currentTrade >= 2 ? 1 : 0.4,
                  fontSize: "10px", gap: "5px",
                  flexShrink: 0,
                  transition: "opacity 0.1s, border-color 0.1s",
                }}
                  onClick={() => handleCardClick(state.explorerPile[0])}
                >
                  <div style={{ color: "var(--trade)", fontWeight: "bold", fontSize: "12px" }}>2</div>
                  <div style={{ fontWeight: "bold" }}>{fr.cardNames.explorer}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>×{state.explorerPile.length}</div>
                </div>
                {player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn && (
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch(buyExplorer(state, viewerId)); }}
                    style={{
                      position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                      fontSize: "9px", background: "var(--trade)", color: "#000",
                      padding: "0 5px", borderRadius: "3px", fontWeight: "bold",
                      border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >{fr.ui.buyBadge}</button>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "40px",
          background: "linear-gradient(to right, transparent, #12121a)",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      </div>

      {/* IN PLAY — ships + bases, horizontal scroll */}
      <div style={{
        padding: "8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "#0d0d14",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
          {fr.ui.inPlay}
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: "7px", flexWrap: "nowrap", paddingBottom: "2px", alignItems: "flex-start" }}>
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
            {/* Visual separator between ships and bases when both present */}
            {player.inPlay.length > 0 && player.bases.length > 0 && (
              <div style={{ width: "1px", background: "var(--border)", alignSelf: "stretch", margin: "0 4px", flexShrink: 0 }} />
            )}
            {player.bases.map((base) => {
              const def = getCardDef(base.definitionId);
              const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
              const canActivate = !base.exhausted && !hasPendingForMe && !isBotTurn;
              return (
                <div key={base.instanceId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{ position: "relative" }}>
                    <CardView
                      card={base}
                      onClick={() => handleCardClick(base)}
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
                  {canActivate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(activateBase(state, viewerId, base.instanceId)); }}
                      style={{
                        width: "var(--card-w)",
                        fontSize: "10px",
                        background: "var(--empire)",
                        color: "#fff",
                        padding: "3px 0",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        border: "none",
                        cursor: "pointer",
                        minHeight: "auto",
                      }}
                    >{fr.actions.activateBase}</button>
                  )}
                </div>
              );
            })}
            {player.inPlay.length === 0 && player.bases.length === 0 && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.4, fontStyle: "italic", padding: "4px 0" }}>
                {fr.ui.inPlayEmpty}
              </div>
            )}
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
              style={{ minHeight: "44px", padding: "4px 10px", fontSize: "12px" }}
            >
              ⚔ {fr.actions.attack} ({player.currentCombat})
            </button>
          )}
          {!canAttackDirect && player.currentCombat > 0 && !isBotTurn && (
            <span style={{
              fontSize: "11px", color: "var(--danger)", background: "rgba(255,85,85,0.1)",
              padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(255,85,85,0.25)",
            }}>
              {fr.ui.outpostBlockPortrait}
            </span>
          )}
          <button
            onClick={() => setShowLog(!showLog)}
            style={{ minHeight: "44px", padding: "4px 8px", fontSize: "11px" }}
          >
            {fr.actions.log}
          </button>
          <button
            className="primary"
            disabled={hasPendingForMe || isBotTurn}
            title={hasPendingForMe ? fr.ui.endTurnTitlePending : isBotTurn ? fr.ui.endTurnTitleBot : undefined}
            onClick={() => dispatch(endTurn(state, viewerId))}
            style={{ minHeight: "44px", padding: "4px 12px" }}
          >
            {fr.actions.endTurn}
          </button>
        </div>
        <div style={{ marginTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isFullscreenSupported ? (
            <button
              aria-label={isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
              onClick={toggleFullscreen}
              style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 8px", minHeight: "22px", background: "transparent", border: "1px solid var(--border)", opacity: 0.7 }}
            >
              {isFullscreen ? fr.actions.exitFullscreen : fr.actions.enterFullscreen}
            </button>
          ) : <span />}
          <button
            aria-label={fr.ui.glossaryTitle}
            onClick={() => setShowGlossary(true)}
            style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 6px", minHeight: "22px", background: "transparent", border: "1px solid var(--border)", opacity: 0.7 }}
          >
            {fr.ui.glossaryBtn}
          </button>
          <button
            onClick={() => { if (confirm(`${fr.actions.concede} ?`)) dispatch(concedeGame(state, viewerId)); }}
            style={{
              fontSize: "10px", color: "var(--text-muted)", padding: "2px 8px",
              minHeight: "22px", background: "transparent",
              border: "1px solid var(--border)", opacity: 0.6,
            }}
          >
            {fr.actions.concede}
          </button>
        </div>
      </div>

      {/* HAND */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        background: "var(--bg)",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px", flexShrink: 0 }}>
          {fr.ui.hand} — {player.name} ({fr.ui.turn} {state.turnNumber})
          {player.hand.length > 0 && (
            <span style={{ marginLeft: "6px", opacity: 0.7 }}>
              · {player.hand.length} carte{player.hand.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ overflowX: "auto", ...(isBotTurn ? { filter: "grayscale(40%)", opacity: 0.7 } : {}) }}>
            <div style={{ display: "flex", gap: "7px", flexWrap: "nowrap", paddingBottom: "4px" }}>
              {player.hand.map((card) => (
                <div key={card.instanceId} style={{ position: "relative" }}>
                  <CardView
                    card={card}
                    playable={!hasPendingForMe && !isBotTurn}
                    onClick={() => handleCardClick(card)}
                  />
                  {!hasPendingForMe && !isBotTurn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(playCard(state, viewerId, card.instanceId)); }}
                      style={{
                        position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)",
                        fontSize: "9px", background: "var(--accent)", color: "#fff",
                        padding: "0 5px", borderRadius: "3px", fontWeight: "bold",
                        border: "none", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >{fr.ui.playBadge}</button>
                  )}
                </div>
              ))}
              {player.hand.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "14px 4px", fontStyle: "italic" }}>
                  {fr.ui.handEmpty}
                </div>
              )}
            </div>
          </div>
          {player.hand.length > 0 && !isBotTurn && (
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "36px",
              background: "linear-gradient(to right, transparent, var(--bg))",
              pointerEvents: "none",
              zIndex: 1,
            }} />
          )}
          {isBotTurn && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.60)",
              pointerEvents: "none",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontStyle: "italic",
                letterSpacing: "0.3px",
              }}>
                {fr.bot.turnLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PORTRAIT — Bot last actions summary */}
      {lastBotActions.length > 0 && (
        <div style={{
          padding: "4px 10px",
          background: "#16152a",
          borderTop: "1px solid var(--accent)",
          fontSize: "10px",
          color: "var(--text-muted)",
          flexShrink: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}>
          <span style={{ color: "var(--accent)", fontWeight: "bold", marginRight: "6px" }}>✦</span>
          {lastBotActions.map(formatBotAction).join(" · ")}
        </div>
      )}

      {/* GAME LOG */}
      {showLog && (
        <div style={{ padding: "6px 8px 8px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>Journal</span>
            <button
              aria-label="Fermer le journal"
              onClick={() => setShowLog(false)}
              style={{ fontSize: "13px", padding: "0 6px", minHeight: "36px", minWidth: "36px", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
            >×</button>
          </div>
          <GameLog entries={state.log} maxHeight={150} />
        </div>
      )}

      {showGlossary && (
        <div onClick={() => setShowGlossary(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", width: "100%", maxWidth: "500px", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontWeight: "bold", fontSize: "15px" }}>{fr.ui.glossaryTitle}</span>
              <button onClick={() => setShowGlossary(false)} style={{ minWidth: "44px", minHeight: "44px", padding: "0", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            {fr.glossary.map(({ term, definition }) => (
              <div key={term} style={{ marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold", color: "var(--accent)" }}>{term}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: "8px", fontSize: "13px" }}>{definition}</span>
              </div>
            ))}
          </div>
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
              ? () => { dispatch(playCard(state, viewerId, selected.instanceId)); setSelected(null); }
              : undefined
          }
          onBuy={
            state.tradeRow.includes(selected)
              && player.currentTrade >= (getCardDef(selected.definitionId).cost ?? 999)
              && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(buyTradeRowCard(state, viewerId, selected.instanceId)); setSelected(null); }
              : state.explorerPile.includes(selected) && player.currentTrade >= 2 && !hasPendingForMe && !isBotTurn
              ? () => { dispatch(buyExplorer(state, viewerId)); setSelected(null); }
              : undefined
          }
          onActivate={
            player.bases.includes(selected) && !selected.exhausted && !hasPendingForMe && !isBotTurn
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
  const orientation = useOrientation();

  if (orientation === "landscape") {
    return (
      <div data-layout="landscape" style={{
        display: "flex", flexDirection: "row", height: "100%",
        background: "var(--bg)", overflow: "hidden",
      }}>
        {/* Left: result + CTA */}
        <div style={{
          flex: "0 0 300px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "20px", gap: "12px", borderRight: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px", textAlign: "center" }}>
            {fr.ui.gameOver}
          </div>
          {winner && (
            <div style={{ color: "var(--success)", fontSize: "15px", textAlign: "center" }}>
              {fr.ui.winner} : {winner.name}
            </div>
          )}
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center" }}>
            {state.gameOverReason === "concede" ? fr.ui.concessionReason : fr.ui.depletionReason}
          </div>
          <button className="primary" onClick={onNewGame} style={{ marginTop: "4px" }}>
            {fr.actions.newGame}
          </button>
        </div>
        {/* Right: game log */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          <GameLog entries={state.log} maxHeight={330} />
        </div>
      </div>
    );
  }

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
