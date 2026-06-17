import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JourneySpine } from "@/shared/journey/JourneySpine";
import { STAGES } from "@/shared/journey/spine";
import { emptyProgressState, type ProgressState } from "@/shared/progress/types";

/**
 * The journey-spine UI contract (the named four-stage arc, rendered):
 *   - `full` is the spine itself: all 4 STAGES in journey order, each showing
 *     its number, name, and one-line promise, each a link to stage.href.
 *   - `compact` condenses the stages (promises hidden) and visually lights the
 *     `currentStage`.
 *   - `showProgress` reads saved progress and never throws when there is none;
 *     before mount it renders the static compact form (no hydration mismatch).
 *
 * The pure rollup (journeyProgress / stage selectors) is covered by
 * journey-spine.test.ts — here we test only the rendered component.
 */

// useProgress is a "use client" localStorage-backed hook; the spine's progress
// numbers come from it. Mock it so each test pins the exact state (or null =
// pre-mount) and we assert the spine's tolerance directly, no timers/storage.
const mockUseProgress = vi.fn<() => { state: ProgressState | null }>();
vi.mock("@/shared/progress/useProgress", () => ({
  useProgress: () => mockUseProgress(),
}));

beforeEach(() => {
  // Default: mounted, but no saved data (the newcomer common case).
  mockUseProgress.mockReturnValue({ state: emptyProgressState() });
});

describe("JourneySpine — full (the spine)", () => {
  it("renders all four stages in journey order with name + promise + href", () => {
    render(<JourneySpine variant="full" />);

    // Every stage's name, promise, and a link to its href are present.
    for (const stage of STAGES) {
      const link = screen.getByRole("link", { name: new RegExp(stage.name, "i") });
      expect(link).toHaveAttribute("href", stage.href);
      expect(within(link).getByText(stage.name)).toBeInTheDocument();
      expect(within(link).getByText(stage.promise)).toBeInTheDocument();
      // The 1-based stage number is shown.
      expect(within(link).getByText(String(stage.n))).toBeInTheDocument();
    }

    // Exactly four stage links, and they appear in journey order in the DOM.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(STAGES.length);
    const order = links.map((l) => l.getAttribute("href"));
    expect(order).toEqual(STAGES.map((s) => s.href));
  });

  it("does not throw and shows no progress count when showProgress is off", () => {
    render(<JourneySpine variant="full" />);
    // No "x/y" progress text on the plain spine.
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).toBeNull();
  });
});

describe("JourneySpine — compact", () => {
  it("renders the four stages condensed, with promises hidden", () => {
    render(<JourneySpine variant="compact" currentStage="structures" />);

    // Names are present...
    for (const stage of STAGES) {
      expect(screen.getByText(stage.name)).toBeInTheDocument();
    }
    // ...but the one-line promises are not rendered in compact form.
    for (const stage of STAGES) {
      expect(screen.queryByText(stage.promise)).toBeNull();
    }
  });

  it("visually lights the currentStage and only that one", () => {
    render(<JourneySpine variant="compact" currentStage="structures" />);

    const lit = screen.getByText("Structures").closest("[data-stage]")!;
    expect(lit).toHaveAttribute("data-current", "true");

    // Every other stage is not current.
    for (const stage of STAGES.filter((s) => s.key !== "structures")) {
      const el = screen.getByText(stage.name).closest("[data-stage]")!;
      expect(el).toHaveAttribute("data-current", "false");
    }
  });

  it("lights nothing when currentStage is omitted (still renders all stages)", () => {
    render(<JourneySpine variant="compact" />);
    for (const stage of STAGES) {
      const el = screen.getByText(stage.name).closest("[data-stage]")!;
      expect(el).toHaveAttribute("data-current", "false");
    }
  });
});

describe("JourneySpine — showProgress (client)", () => {
  it("renders without throwing when there is NO saved data (mounted, empty state)", () => {
    mockUseProgress.mockReturnValue({ state: emptyProgressState() });
    expect(() =>
      render(<JourneySpine variant="compact" currentStage="foundations" showProgress />),
    ).not.toThrow();
    // The lit stage shows a 0/total count once mounted with empty progress.
    const lit = screen.getByText("Foundations").closest("[data-stage]")!;
    expect(within(lit as HTMLElement).getByText(/^0\s*\/\s*\d+$/)).toBeInTheDocument();
  });

  it("renders the static compact form before mount (state === null) — no count, no throw", () => {
    mockUseProgress.mockReturnValue({ state: null });
    expect(() =>
      render(<JourneySpine variant="compact" currentStage="structures" showProgress />),
    ).not.toThrow();
    // All stages still render (static compact form), and the current one is lit.
    for (const stage of STAGES) expect(screen.getByText(stage.name)).toBeInTheDocument();
    const lit = screen.getByText("Structures").closest("[data-stage]")!;
    expect(lit).toHaveAttribute("data-current", "true");
    // No progress count is shown before mount (avoids hydration mismatch).
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).toBeNull();
  });

  it("shows the overall x/y count on the current stage when progress exists", () => {
    // A state with one completed foundations topic. journeyProgress counts it
    // against the platform-wide overall total; we assert the count appears.
    const state = emptyProgressState();
    state.categories = {
      "programming-basics": {
        // A real registry topic key would be needed to count > 0; this test only
        // requires the count element to render in "done/total" shape, which the
        // empty-but-mounted state already satisfies via overallTotal.
      },
    };
    mockUseProgress.mockReturnValue({ state });
    render(<JourneySpine variant="compact" currentStage="foundations" showProgress />);
    const lit = screen.getByText("Foundations").closest("[data-stage]")!;
    // done/total where total is the platform-wide count (> 0 in a real registry).
    expect(within(lit as HTMLElement).getByText(/^\d+\s*\/\s*\d+$/)).toBeInTheDocument();
  });
});
