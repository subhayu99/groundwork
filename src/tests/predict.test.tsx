import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PredictGate } from "@/shared/lesson/Predict";
import type { BeatVisualApi } from "@/shared/lesson/types";

/**
 * The prediction-gate contract: one tap → feedback → api.onInteractionDone(),
 * REGARDLESS of correctness (gates are engagement, never punishment), and the
 * first tap decides (no answer-churn grunt work).
 */

const mkApi = (): BeatVisualApi => ({ onActiveLine: vi.fn(), onInteractionDone: vi.fn() });

const choices = [
  { id: "halves", label: "the window halves", correct: true, note: "each probe discards half" },
  { id: "doubles", label: "the window doubles", note: "comparisons only ever discard" },
  { id: "same", label: "nothing changes" },
];

describe("PredictGate", () => {
  it("renders the question and one pill per choice, none pressed", () => {
    render(<PredictGate question="After one probe, the window…" choices={choices} api={mkApi()} />);
    expect(screen.getByText("After one probe, the window…")).toBeInTheDocument();
    const pills = screen.getAllByRole("button");
    expect(pills).toHaveLength(3);
    for (const p of pills) expect(p).toHaveAttribute("aria-pressed", "false");
  });

  it("a CORRECT tap unlocks the gate and affirms", () => {
    const api = mkApi();
    const onRevealed = vi.fn();
    render(<PredictGate question="q" choices={choices} api={api} onRevealed={onRevealed} />);
    fireEvent.click(screen.getByRole("button", { name: "the window halves" }));
    expect(api.onInteractionDone).toHaveBeenCalledTimes(1);
    expect(onRevealed).toHaveBeenCalledWith("halves", true);
    expect(screen.getByRole("button", { name: "the window halves" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/exactly/i);
  });

  it("a WRONG tap ALSO unlocks the gate, explains via the note, and reveals the answer", () => {
    const api = mkApi();
    const onRevealed = vi.fn();
    render(<PredictGate question="q" choices={choices} api={api} onRevealed={onRevealed} />);
    fireEvent.click(screen.getByRole("button", { name: "the window doubles" }));
    expect(api.onInteractionDone).toHaveBeenCalledTimes(1); // never punished
    expect(onRevealed).toHaveBeenCalledWith("doubles", false);
    expect(screen.getByRole("status")).toHaveTextContent("comparisons only ever discard");
    // the correct pill stays visible (revealed subtly) but the choice is settled
    expect(screen.getByRole("button", { name: "the window halves" })).toBeDisabled();
  });

  it("a wrong tap with NO note still gives a gentle line", () => {
    const api = mkApi();
    render(<PredictGate question="q" choices={choices} api={api} />);
    fireEvent.click(screen.getByRole("button", { name: "nothing changes" }));
    expect(api.onInteractionDone).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/not quite/i);
  });

  it("the FIRST tap decides — later taps are inert and never re-fire the gate", () => {
    const api = mkApi();
    const onRevealed = vi.fn();
    render(<PredictGate question="q" choices={choices} api={api} onRevealed={onRevealed} />);
    fireEvent.click(screen.getByRole("button", { name: "the window doubles" }));
    fireEvent.click(screen.getByRole("button", { name: "the window halves" }));
    fireEvent.click(screen.getByRole("button", { name: "the window doubles" }));
    expect(api.onInteractionDone).toHaveBeenCalledTimes(1);
    expect(onRevealed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "the window doubles" })).toHaveAttribute("aria-pressed", "true");
  });
});
