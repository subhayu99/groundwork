import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PlanTimeline } from "@/shared/journey/PlanTimeline";
import { planFor } from "@/shared/journey/plans";
import { listAllTopics } from "@/categories/registry";
import { emptyProgressState, type ProgressState } from "@/shared/progress/types";
import type { Goal } from "@/shared/audience/types";
import type { StudyPlan } from "@/shared/journey/plans";
import type { TopicMeta } from "@/shared/derivation/types";

/**
 * LEAF B — Plan UI contract (PlanTimeline only; the /plan page is checked at the
 * integration gate, never imported here).
 *
 * PlanTimeline is a PURE presentational component over a StudyPlan: it must render
 * EVERY milestone, IN ORDER, each carrying its number, name, own minutes, and the
 * running cumulative time — and reflect `done`. The plan data it renders comes from
 * the frozen `planFor` contract, whose cumulative time is non-decreasing for every
 * goal (the property the timeline visually depends on).
 */

const GOALS: Goal[] = ["understand", "interview", "refresh"];
const topics: TopicMeta[] = listAllTopics();

function fmt(mins: number): string {
  // Human "1h 20m" / "45m" rendering the component is expected to use.
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function completeTopic(state: ProgressState, category: string, topic: string): ProgressState {
  state.categories[category] = state.categories[category] ?? {};
  state.categories[category][topic] = {
    derivation: { currentStep: 1, completedSteps: [1], revealedHints: [], completed: true },
    problems: {},
    customInputs: [],
  };
  return state;
}

describe("planFor — cumulative time is non-decreasing (the property the timeline relies on)", () => {
  it.each(GOALS)("planFor(%s): cumulativeMinutes never decreases", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    expect(plan.milestones.length).toBeGreaterThan(0);
    let prev = 0;
    for (const m of plan.milestones) {
      expect(m.cumulativeMinutes).toBeGreaterThanOrEqual(prev);
      prev = m.cumulativeMinutes;
    }
  });

  it.each(GOALS)("planFor(%s): each cumulative = previous cumulative + this minutes", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    let running = 0;
    for (const m of plan.milestones) {
      running += m.minutes;
      expect(m.cumulativeMinutes).toBe(running);
    }
    // and the last cumulative is the plan total
    expect(plan.milestones[plan.milestones.length - 1].cumulativeMinutes).toBe(plan.totalMinutes);
  });
});

describe("PlanTimeline — renders every milestone in order with cumulative time", () => {
  it("renders one timeline item per milestone (no more, no fewer)", () => {
    const plan = planFor("understand", emptyProgressState(), topics);
    render(<PlanTimeline plan={plan} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(plan.milestones.length);
  });

  it("renders every milestone's name, 1-based position, and cumulative time, IN PLAN ORDER", () => {
    const plan = planFor("understand", emptyProgressState(), topics);
    render(<PlanTimeline plan={plan} />);
    const items = screen.getAllByRole("listitem");

    plan.milestones.forEach((m, i) => {
      const item = items[i];
      // name is present in this item
      expect(within(item).getByText(m.name)).toBeInTheDocument();
      // the 1-based milestone number is present
      expect(within(item).getByText(String(i + 1))).toBeInTheDocument();
      // the running cumulative time is rendered (human-formatted)
      expect(item).toHaveTextContent(fmt(m.cumulativeMinutes));
    });
  });

  it("the rendered name order matches the plan's milestone order exactly", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    render(<PlanTimeline plan={plan} />);
    const items = screen.getAllByRole("listitem");
    const renderedNames = items.map((it, i) => {
      // the milestone name node carries data-testid="milestone-name"
      const nameEl = within(it).getByTestId("milestone-name");
      return nameEl.textContent;
    });
    expect(renderedNames).toEqual(plan.milestones.map((m) => m.name));
  });

  it("marks DONE milestones distinctly and leaves not-done ones unmarked", () => {
    const state = emptyProgressState();
    // complete the first registry topic so at least one milestone is done.
    const first = topics[0];
    completeTopic(state, first.category, first.key);
    const plan = planFor("understand", state, topics);
    render(<PlanTimeline plan={plan} />);
    const items = screen.getAllByRole("listitem");

    plan.milestones.forEach((m, i) => {
      const item = items[i];
      if (m.done) {
        // a done milestone exposes an accessible "done"/"completed" affordance
        expect(within(item).getByLabelText(/done|completed/i)).toBeInTheDocument();
      } else {
        expect(within(item).queryByLabelText(/done|completed/i)).toBeNull();
      }
    });

    // sanity: the plan we rendered actually had a done milestone to exercise the branch
    expect(plan.milestones.some((m) => m.done)).toBe(true);
  });

  it("renders each milestone's OWN minutes alongside the cumulative running time", () => {
    const plan = planFor("refresh", emptyProgressState(), topics);
    render(<PlanTimeline plan={plan} />);
    const items = screen.getAllByRole("listitem");
    plan.milestones.forEach((m, i) => {
      // both this-topic minutes and cumulative are visible on the item
      expect(items[i]).toHaveTextContent(fmt(m.minutes));
      expect(items[i]).toHaveTextContent(fmt(m.cumulativeMinutes));
    });
  });

  it("each milestone links to its topic href", () => {
    const plan = planFor("refresh", emptyProgressState(), topics);
    render(<PlanTimeline plan={plan} />);
    for (const m of plan.milestones) {
      const link = screen.getByRole("link", { name: new RegExp(m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") });
      expect(link).toHaveAttribute("href", m.href);
    }
  });
});
