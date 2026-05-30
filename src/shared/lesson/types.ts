import { ReactNode } from "react";

/**
 * The annotated-canvas LESSON CONTRACT.
 *
 * A lesson is DATA: an ordered list of beats. Each beat draws a visual in the
 * canvas coordinate space and places explanatory text panels (with arrows) on
 * that same plane; the docked code panel lights the lines the beat is about.
 * `LessonRuntime` renders any spec; topics only supply the data. One engine,
 * N topics — and the same shape an AI generator can later target.
 */

/** API handed to an interactive beat's visual so it can drive the lesson. */
export interface BeatVisualApi {
  /** Emit the `@sync` code label(s) to highlight right now (overrides static codeLabels). */
  onActiveLine: (labels: (string | number)[]) => void;
  /** Call once the user performs the gating interaction (satisfies a `wedge` beat). */
  onInteractionDone: () => void;
}

/** A beat's visual: static SVG content, or a render-fn for interactive beats. */
export type BeatVisual = ReactNode | ((api: BeatVisualApi) => ReactNode);

/** A text panel that lives ON the canvas plane (coordinates in canvas space). */
export interface LessonPanel {
  left: number;
  top: number;
  width: number;
  /** Small uppercase kicker, e.g. "THE WEDGE". */
  label?: string;
  /** Bold lead line. */
  title?: string;
  /** The explanation body (rich JSX). */
  body: ReactNode;
  /** "main" = primary accented panel; "note" = secondary/aside (e.g. the wedge question). */
  variant?: "main" | "note";
}

/** A straight connector with an arrowhead, in canvas coordinates. */
export interface LessonArrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type BeatInteraction = "none" | "playback" | "wedge";

export interface LessonBeat {
  /** Stable key (used for animation + nav). */
  id: string;
  /** Visual drawn in canvas space (an <svg> group's contents). */
  visual: BeatVisual;
  /** Text panels placed on the plane. */
  panels: LessonPanel[];
  /** Connectors from panels to elements. */
  arrows?: LessonArrow[];
  /** `@sync` labels in `codeSource` to highlight (fallback when the visual isn't emitting). */
  codeLabels?: string[];
  /** Does this beat auto-play or require a user action before "Next"? Default "none". */
  interaction?: BeatInteraction;
}

export interface LessonSpec {
  topicTitle: string;
  /** Canvas design size; every beat draws inside this coordinate box. */
  canvas: { width: number; height: number };
  /** Raw `algorithm.py` source (with `@sync:` anchors) for the docked code panel. */
  codeSource: string;
  beats: LessonBeat[];
}
