import { useState } from "react";
import type { GameState, PendingChoice, PlayerId, Effect } from "../game/types";
import type { ChoicePayload } from "../game/choices";
import { CardView } from "./CardView";

interface Props {
  state: GameState;
  viewerId: PlayerId;
  onResolve: (choiceId: string, payload: ChoicePayload) => void;
}

export function PendingChoicePanel({ state, viewerId, onResolve }: Props) {
  const myChoices = state.pendingChoices.filter((c) => c.playerId === viewerId);
  if (myChoices.length === 0) return null;

  const choice = myChoices[0];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200,
      padding: "16px",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--accent)",
        borderRadius: "12px",
        padding: "16px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "80vh",
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
          <Title text="Choose one:" />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {choice.options!.map((option, i) => (
              <button key={i} onClick={() => onResolve(choice.id, { type: "choose_one", optionIndex: i })}>
                {option.map((e: Effect) => describeEffect(e)).join(", ")}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "select_cards_to_scrap":
    case "select_cards_to_discard_then_draw": {
      const label = choice.type === "select_cards_to_scrap" ? "scrap" : "discard";
      const candidates = getCandidates(choice, state);
      const max = choice.amount ?? 1;

      function toggle(id: string) {
        setSelected(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : prev.length < max ? [...prev, id] : prev
        );
      }

      return (
        <div>
          <Title text={`Select up to ${max} card(s) to ${label}:`} />
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
              Confirm ({selected.length} selected)
            </button>
            {skipable && <button onClick={skip}>Skip</button>}
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
          <Title text={`Discard ${amount} card(s):`} />
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
              Confirm
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
        select_trade_row_card_to_scrap: "Scrap from Trade Row:",
        select_base_to_destroy: "Destroy a base:",
        select_ship_to_acquire_free: "Acquire a ship for free:",
        select_ship_to_copy: "Copy a ship:",
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
              <button onClick={skip}>Skip</button>
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <div>
          <Title text="Unknown choice" />
          {skipable && <button onClick={skip}>Skip</button>}
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

function describeEffect(e: Effect): string {
  switch (e.type) {
    case "gain_trade": return `+${e.amount} Trade`;
    case "gain_combat": return `+${e.amount} Combat`;
    case "gain_authority": return `+${e.amount} Authority`;
    case "draw": return `Draw ${e.amount}`;
    case "discard_up_to_then_draw_same": return `Discard/Draw (${e.max})`;
    default: return e.type.replace(/_/g, " ");
  }
}
