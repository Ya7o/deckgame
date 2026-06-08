import { useState } from "react";
import type { GameState, PendingChoice, PlayerId, Effect } from "../game/types";
import type { ChoicePayload } from "../game/choices";
import { CardView } from "./CardView";
import { useOrientation } from "../hooks/useOrientation";
import { fr, renderEffectFr } from "../i18n";

interface Props {
  state: GameState;
  viewerId: PlayerId;
  onResolve: (choiceId: string, payload: ChoicePayload) => void;
}

export function PendingChoicePanel({ state, viewerId, onResolve }: Props) {
  // useOrientation must be called before any conditional return (Rules of Hooks)
  const orientation = useOrientation();
  const myChoices = state.pendingChoices.filter((c) => c.playerId === viewerId);
  if (myChoices.length === 0) return null;

  const choice = myChoices[0];
  // In landscape (390px), use 88% to maximize usable height
  const panelMaxH = orientation === "landscape" ? "88vh" : "80vh";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200,
      padding: orientation === "landscape" ? "8px" : "16px",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--accent)",
        borderRadius: "12px",
        padding: "12px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: panelMaxH,
        overflowY: "auto",
      }}>
        <ChoiceResolver choice={choice} state={state} onResolve={onResolve} />
      </div>
    </div>
  );
}

function ChoiceResolver({ choice, state, onResolve }: {
  choice: PendingChoice;
  state: GameState;
  onResolve: (id: string, payload: ChoicePayload) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const skipable = choice.optional;

  function skip() { onResolve(choice.id, { type: "skip" }); }

  switch (choice.type) {
    case "choose_one": {
      return (
        <div>
          <Title text={fr.choiceLabels.choose_one} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {choice.options!.map((option, i) => (
              <button key={i} onClick={() => onResolve(choice.id, { type: "choose_one", optionIndex: i })}>
                {option.map((e: Effect) => renderEffectFr(e)).join(", ")}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "select_cards_to_scrap":
    case "select_cards_to_discard_then_draw": {
      const labelFn = choice.type === "select_cards_to_scrap"
        ? fr.choiceLabels.select_cards_to_scrap
        : fr.choiceLabels.select_cards_to_discard_then_draw;
      const max = choice.amount ?? 1;
      const candidates = getCandidates(choice, state);

      function toggle(id: string) {
        setSelected(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : prev.length < max ? [...prev, id] : prev
        );
      }

      return (
        <div>
          <Title text={labelFn(max)} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {candidates.map((card) => (
              <CardView
                key={card.instanceId}
                card={card}
                selected={selected.includes(card.instanceId)}
                onClick={() => toggle(card.instanceId)}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button className="primary" onClick={() => onResolve(choice.id, { type: "select_cards", cardIds: selected })}>
              {fr.ui.confirmSelected(selected.length)}
            </button>
            {skipable && <button onClick={skip}>{fr.actions.skip}</button>}
          </div>
        </div>
      );
    }

    case "opponent_discard": {
      const candidates = getCandidates(choice, state);
      const amount = choice.amount ?? 1;

      function toggle(id: string) {
        setSelected(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : prev.length < amount ? [...prev, id] : prev
        );
      }

      return (
        <div>
          <Title text={fr.choiceLabels.opponent_discard(amount)} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {candidates.map((card) => (
              <CardView
                key={card.instanceId}
                card={card}
                selected={selected.includes(card.instanceId)}
                onClick={() => toggle(card.instanceId)}
              />
            ))}
          </div>
          <div style={{ marginTop: "12px" }}>
            <button
              className="primary"
              disabled={selected.length < Math.min(amount, candidates.length)}
              onClick={() => onResolve(choice.id, { type: "select_cards", cardIds: selected })}
            >
              {fr.actions.confirm}
            </button>
          </div>
        </div>
      );
    }

    case "select_trade_row_card_to_scrap":
    case "select_base_to_destroy":
    case "select_ship_to_acquire_free":
    case "select_ship_to_copy": {
      const labels: Record<string, string> = {
        select_trade_row_card_to_scrap: fr.choiceLabels.select_trade_row_card_to_scrap,
        select_base_to_destroy: fr.choiceLabels.select_base_to_destroy,
        select_ship_to_acquire_free: fr.choiceLabels.select_ship_to_acquire_free,
        select_ship_to_copy: fr.choiceLabels.select_ship_to_copy,
      };
      const candidates = getCandidates(choice, state);

      return (
        <div>
          <Title text={labels[choice.type]} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {candidates.map((card) => (
              <CardView
                key={card.instanceId}
                card={card}
                selected={selected.includes(card.instanceId)}
                onClick={() => onResolve(choice.id, { type: "select_cards", cardIds: [card.instanceId] })}
              />
            ))}
          </div>
          {skipable && (
            <div style={{ marginTop: "12px" }}>
              <button onClick={skip}>{fr.actions.skip}</button>
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <div>
          <Title text={fr.ui.unknownChoice} />
          {skipable && <button onClick={skip}>{fr.actions.skip}</button>}
        </div>
      );
  }
}

function Title({ text }: { text: string }) {
  return <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>{text}</div>;
}

function getCandidates(choice: PendingChoice, state: GameState) {
  const ids = new Set(choice.candidateIds ?? []);
  const all = [
    ...state.tradeDeck,
    ...state.tradeRow,
    ...state.scrapHeap,
    ...Object.values(state.players).flatMap(p => [...p.deck, ...p.hand, ...p.discard, ...p.inPlay, ...p.bases]),
  ];
  return all.filter(c => ids.has(c.instanceId));
}
