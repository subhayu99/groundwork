"use client";

import { ReactNode } from "react";

/**
 * The contract EVERY topic visualizer implements (and that AI-generated pages
 * must target). One definition — not re-declared per topic.
 */
export interface VisualizerProps {
  /** Current derivation step (1-based). */
  step: number;
  /** Fire on the step-3 "wedge" interaction to unlock the Continue button. */
  onWedgeInteraction?: () => void;
  /** Emit the code line(s) the current operation maps to (prefer `@sync` labels). */
  onActiveLine?: (lines: (number | string)[]) => void;
}

/**
 * Declarative step→view dispatch, replacing the `if (step <= 2) … if (step === 3)
 * … else …` block every visualizer used to hand-roll (along with a re-declared
 * `VisualizerProps`). Phases are matched in order by an inclusive `until` upper
 * bound; the last phase omits `until` as the catch-all.
 *
 *   export const FooVisualizer = phasedVisualizer([
 *     { until: 2, render: () => <NaiveViz /> },                       // steps 1–2 (naive)
 *     { until: 3, render: (p) => <WedgeViz onInteraction={p.onWedgeInteraction} onActiveLine={p.onActiveLine} /> },
 *     { until: 5, render: (p) => <DerivedViz onActiveLine={p.onActiveLine} /> },
 *     { render: (p) => <SummaryViz /> },                              // steps 6+
 *   ]);
 *
 * The render fn receives the full props, so a phase wires exactly the props its
 * view needs. Naive phases simply don't forward `onActiveLine` (no live emit),
 * which — together with the code panel's naive-phase suppression — keeps the
 * highlight from claiming a not-yet-derived line.
 */
export interface VisualizerPhase {
  /** Inclusive upper step bound for this phase. Omit on the final (catch-all) phase. */
  until?: number;
  render: (props: VisualizerProps) => ReactNode;
}

export function phasedVisualizer(phases: VisualizerPhase[]) {
  function PhasedVisualizer(props: VisualizerProps) {
    const phase =
      phases.find((p) => p.until === undefined || props.step <= p.until) ??
      phases[phases.length - 1];
    return <>{phase.render(props)}</>;
  }
  return PhasedVisualizer;
}
