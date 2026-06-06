import { useState } from "react";
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

interface Props {
  initialState: GameState;
  onNewGame: () => void;
}

export function GameBoard({ initialState, onNewGame }: Props) {
  const [state, setState] = useState<GameState>(initialState);
  const [selected, setSelected] = useState<CardInstance | null>(null);
  const [showLog, setShowLog] = useState(false);

  const viewerId = state.currentPlayerId;
  const player = state.players[viewerId];
  const opponent = state.players[state.opponentPlayerId];

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
  const hasPendingForOpponent = state.pendingChoices.some(c => c.playerId !== viewerId);
  const opponentOutposts = opponent.bases.filter(b => getCardDef(b.definitionId).isOutpost);
  const canAttackDirect = opponentOutposts.length === 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--bg)", overflow: "hidden",
    }}>
      {/* ZONE ADVERSE */}
      <div style={{
        padding: "8px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div>
            <span style={{ fontWeight: "bold", fontSize: "13px" }}>{opponent.name}</span>
            <span style={{ marginLeft: "8px", color: "var(--authority)" }}>♥ {opponent.authority}</span>
            <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "11px" }}>
              {fr.ui.deck} {opponent.deck.length} | {fr.ui.discard} {opponent.discard.length} | {fr.ui.hand_short} {opponent.hand.length}
            </span>
          </div>
          {hasPendingForOpponent && (
            <span style={{ fontSize: "11px", color: "var(--trade)", background: "var(--surface2)", padding: "2px 6px", borderRadius: "4px" }}>
              {fr.ui.waiting}
            </span>
          )}
        </div>
        {/* Bases adverses */}
        {opponent.bases.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {opponent.bases.map((base) => {
              const def = getCardDef(base.definitionId);
              const canAttack = player.currentCombat >= (def.defense ?? 999) && !hasPendingForMe;
              return (
                <CardView
                  key={base.instanceId}
                  card={base}
                  onClick={() => {
                    if (canAttack) dispatch(attackBase(state, viewerId, base.instanceId));
                    else handleCardClick(base);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* RANGÉE COMMERCIALE */}
      <div style={{
        padding: "8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "#12121a",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
          {fr.ui.tradeRow} — {fr.ui.tradeDeck} : {state.tradeDeck.length} | {fr.ui.explorerPile} : {state.explorerPile.length}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "flex-start" }}>
          {state.tradeRow.map((card) => {
            const def = getCardDef(card.definitionId);
            const canBuy = player.currentTrade >= (def.cost ?? 999);
            return (
              <div key={card.instanceId} style={{ position: "relative" }}>
                <CardView
                  card={card}
                  dimmed={!canBuy}
                  onClick={() => {
                    if (canBuy && !hasPendingForMe) dispatch(buyTradeRowCard(state, viewerId, card.instanceId));
                    else handleCardClick(card);
                  }}
                />
                {canBuy && (
                  <div style={{
                    position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)",
                    fontSize: "9px", background: "var(--trade)", color: "#000", padding: "0 4px", borderRadius: "3px",
                  }}>{fr.ui.buyBadge}</div>
                )}
              </div>
            );
          })}
          {/* Explorateur */}
          {state.explorerPile.length > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{
                width: "var(--card-w)", height: "var(--card-h)",
                border: "1px solid var(--border)", borderRadius: "var(--radius)",
                background: "var(--surface2)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: player.currentTrade >= 2 && !hasPendingForMe ? "pointer" : "default",
                opacity: player.currentTrade >= 2 ? 1 : 0.4,
                fontSize: "10px", gap: "4px",
              }}
                onClick={() => {
                  if (player.currentTrade >= 2 && !hasPendingForMe) dispatch(buyExplorer(state, viewerId));
                }}
              >
                <div style={{ color: "var(--trade)", fontWeight: "bold" }}>2</div>
                <div>{fr.cardNames.explorer}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>×{state.explorerPile.length}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EN JEU */}
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
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {player.inPlay.map((card) => {
            const def = getCardDef(card.definitionId);
            const hasSelfScrap = def.scrapEffects.some(e => e.type === "self_scrap");
            return (
              <div key={card.instanceId} style={{ position: "relative" }}>
                <CardView card={card} onClick={() => handleCardClick(card)} />
                {hasSelfScrap && !hasPendingForMe && (
                  <div
                    onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, card.instanceId)); }}
                    style={{
                      position: "absolute", top: "2px", right: "2px",
                      fontSize: "8px", background: "var(--danger)", color: "#fff",
                      padding: "0 3px", borderRadius: "2px", cursor: "pointer",
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
                    if (!hasPendingForMe && !base.exhausted) dispatch(activateBase(state, viewerId, base.instanceId));
                    else handleCardClick(base);
                  }}
                />
                {hasSelfScrap && !hasPendingForMe && (
                  <div
                    onClick={(e) => { e.stopPropagation(); dispatch(activateSelfScrap(state, viewerId, base.instanceId)); }}
                    style={{
                      position: "absolute", top: "2px", right: "2px",
                      fontSize: "8px", background: "var(--danger)", color: "#fff",
                      padding: "0 3px", borderRadius: "2px", cursor: "pointer",
                    }}
                  >⊗</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BARRE DE RESSOURCES */}
      <div style={{
        padding: "6px 12px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ color: "var(--authority)", fontWeight: "bold" }}>♥ {player.authority}</span>
          <span style={{ color: "var(--trade)", fontWeight: "bold" }}>{fr.resources.trade[0]} : {player.currentTrade}</span>
          <span style={{ color: "var(--combat)", fontWeight: "bold" }}>⚔ : {player.currentCombat}</span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            {fr.ui.deck} {player.deck.length} | {fr.ui.discard} {player.discard.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {canAttackDirect && player.currentCombat > 0 && !hasPendingForMe && (
            <AttackDirectButton
              combat={player.currentCombat}
              onAttack={(amount) => dispatch(attackOpponent(state, viewerId, amount))}
            />
          )}
          <button
            onClick={() => setShowLog(!showLog)}
            style={{ minHeight: "32px", padding: "4px 8px", fontSize: "11px" }}
          >
            {fr.actions.log}
          </button>
          <button
            className="danger"
            onClick={() => { if (confirm(`${fr.actions.concede} ?`)) dispatch(concedeGame(state, viewerId)); }}
            style={{ minHeight: "32px", padding: "4px 8px", fontSize: "11px" }}
          >
            {fr.actions.concede}
          </button>
          <button
            className="primary"
            disabled={hasPendingForMe}
            onClick={() => dispatch(endTurn(state, viewerId))}
          >
            {fr.actions.endTurn}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1,
        padding: "8px",
        overflowX: "auto",
        overflowY: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
          {fr.ui.hand} — {player.name} ({fr.ui.turn} {state.turnNumber})
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {player.hand.map((card) => (
            <CardView
              key={card.instanceId}
              card={card}
              onClick={() => {
                if (!hasPendingForMe) dispatch(playCard(state, viewerId, card.instanceId));
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

      {/* JOURNAL */}
      {showLog && (
        <div style={{ padding: "8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <GameLog entries={state.log} />
        </div>
      )}

      {/* CHOIX EN ATTENTE */}
      <PendingChoicePanel state={state} viewerId={viewerId} onResolve={handleResolveChoice} />

      {/* DÉTAIL DE CARTE */}
      {selected && (
        <CardDetailModal
          card={selected}
          state={state}
          onClose={() => setSelected(null)}
          onPlay={
            player.hand.includes(selected) && !hasPendingForMe
              ? () => { dispatch(playCard(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onBuy={
            state.tradeRow.includes(selected) && !hasPendingForMe
              ? () => { dispatch(buyTradeRowCard(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onActivate={
            player.bases.includes(selected) && !hasPendingForMe
              ? () => { dispatch(activateBase(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onSelfScrap={
            (player.inPlay.includes(selected) || player.bases.includes(selected)) && !hasPendingForMe
              ? () => { dispatch(activateSelfScrap(state, viewerId, selected.instanceId)); }
              : undefined
          }
          onAttackBase={
            opponent.bases.includes(selected) && player.currentCombat >= (getCardDef(selected.definitionId).defense ?? 999) && !hasPendingForMe
              ? () => { dispatch(attackBase(state, viewerId, selected.instanceId)); }
              : undefined
          }
        />
      )}
    </div>
  );
}

function AttackDirectButton({ combat, onAttack }: { combat: number; onAttack: (n: number) => void }) {
  const [amount, setAmount] = useState(combat);

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <input
        type="number"
        min={1}
        max={combat}
        value={amount}
        onChange={e => setAmount(Math.min(combat, Math.max(1, +e.target.value)))}
        style={{
          width: "48px", background: "var(--surface2)", border: "1px solid var(--border)",
          color: "var(--combat)", borderRadius: "4px", padding: "4px 6px", fontSize: "12px",
        }}
      />
      <button
        className="danger"
        onClick={() => onAttack(amount)}
        style={{ minHeight: "32px", padding: "4px 8px", fontSize: "11px" }}
      >
        {fr.actions.attack}
      </button>
    </div>
  );
}

function GameOverScreen({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const winner = state.winner ? state.players[state.winner] : null;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: "16px",
    }}>
      <div style={{ fontSize: "32px", fontWeight: "bold" }}>{fr.ui.gameOver}</div>
      {winner && <div style={{ color: "var(--success)", fontSize: "18px" }}>{fr.ui.winner} : {winner.name}</div>}
      <div style={{ color: "var(--text-muted)" }}>
        {state.gameOverReason === "concede" ? fr.ui.concessionReason : fr.ui.depletionReason}
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button className="primary" onClick={onNewGame}>{fr.actions.newGame}</button>
      </div>
      <div style={{ maxWidth: "400px", width: "100%", padding: "0 16px" }}>
        <GameLog entries={state.log} maxHeight={200} />
      </div>
    </div>
  );
}
