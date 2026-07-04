import { ReactNode } from "react";
import { pickRegister, type Goal, type Register, type Registered } from "@/shared/audience/types";

/**
 * The annotated-canvas LESSON CONTRACT.
 *
 * A lesson is DATA: an ordered list of beats. Each beat draws a visual in the
 * canvas coordinate space and places explanatory text panels (with arrows) on
 * that same plane; the docked code panel lights the lines the beat is about.
 * `LessonRuntime` renders any spec; topics only supply the data. One engine,
 * N topics — and the same shape an AI generator can later target.
 *
 * AUDIENCE REGISTERS: the SKELETON of a lesson (visual, code, beat order,
 * interactions, geometry) is authored once and shared by every audience. Only
 * the PROSE fields (`connector`, panel `label`/`title`/`body`, `detail`,
 * `actionLabel`, `takeaway`) may vary by register — author them either as a
 * plain value (one voice for everyone) or wrapped in `reg({ base, intuitive,
 * rigorous, … })` from `@/shared/audience/types`. The engine resolves beats for
 * the learner's active register before either layout sees them, with `base` as
 * the universal fallback — so a half-converted lesson always renders.
 */

/** API handed to an interactive beat's visual so it can drive the lesson. */
export interface BeatVisualApi {
  /** Emit the `@sync` code label(s) to highlight right now (overrides static codeLabels). */
  onActiveLine: (labels: (string | number)[]) => void;
  /** Call once the user performs the gating interaction (satisfies a `wedge` beat).
   *  GATE HONESTY: fire this on the REAL interaction — the tap/click/choice that
   *  actually answers the beat's question (e.g. a `PredictGate` choice, a cell
   *  click) — never on mount, hover, or an unrelated passthrough click. A gate
   *  the learner didn't genuinely act on teaches them gates are noise. */
  onInteractionDone: () => void;
}

/** A beat's visual: static SVG content, or a render-fn for interactive beats. */
export type BeatVisual = ReactNode | ((api: BeatVisualApi) => ReactNode);

/** Geometry + role of a panel — register-independent. */
interface LessonPanelBase {
  left: number;
  top: number;
  width: number;
  /** "main" = primary accented panel; "note" = secondary/aside (e.g. the wedge question). */
  variant?: "main" | "note";
}

/** A text panel that lives ON the canvas plane (coordinates in canvas space). */
export interface LessonPanel extends LessonPanelBase {
  /** Small uppercase kicker, e.g. "THE WEDGE". */
  label?: Registered<string>;
  /** Bold lead line. */
  title?: Registered<string>;
  /** The explanation body (rich JSX). */
  body: Registered<ReactNode>;
}

/** A panel after register resolution — what the layouts actually render. */
export interface ResolvedLessonPanel extends LessonPanelBase {
  label?: string;
  title?: string;
  body: ReactNode;
}

/** A straight connector with an arrowhead, in canvas coordinates. */
export interface LessonArrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type BeatInteraction = "none" | "playback" | "wedge";

/** The register-independent SKELETON of a beat (visual, sync, interaction, nav). */
interface LessonBeatBase {
  /** Stable key (used for animation + nav). */
  id: string;
  /** Step label for the numbered sequence, e.g. "The wedge". Shown as "Step k of N · <label>". */
  label?: string;
  /** Visual drawn in canvas space (an <svg> group's contents). */
  visual: BeatVisual;
  /** Connectors from panels to elements. */
  arrows?: LessonArrow[];
  /** `@sync` labels in `codeSource` to highlight (fallback when the visual isn't emitting). */
  codeLabels?: string[];
  /** Does this beat auto-play or require a user action before "Next"? Default "none". */
  interaction?: BeatInteraction;
  /** Depth gate: registers this beat appears for. undefined = ALL registers.
   *  The engine filters BEFORE prose resolution, so depth never forks the skeleton. */
  registers?: Register[];
  /** Drop this beat when the learner's goal is "refresh" (one trim past the
   *  register cut). Default (absent/false) keeps the beat. */
  trimOnRefresh?: boolean;
}

export interface LessonBeat extends LessonBeatBase {
  /** A short connective lead-in that links this beat to the previous one (rebuilds the
   *  narrative thread). Rendered as a quiet italic line atop the detail card. Empty/omit for beat 1. */
  connector?: Registered<string>;
  /** Text panels placed on the plane (the concise on-canvas hook). */
  panels: LessonPanel[];
  /** The fuller explanation, restored from the old derivation depth. Rendered ALWAYS-VISIBLE
   *  in a card in the lower area (rich JSX: paragraphs, <code>, an optional callout). */
  detail?: Registered<ReactNode>;
  /** Forward-looking label for the advance button (revives the old actionLabel thread),
   *  e.g. "Use the sortedness". Falls back to "Next" when absent. */
  actionLabel?: Registered<string>;
  /** One short line — "what we've established" — for the accreting spine in the
   *  scene layout. Once this beat is completed it stays as a quiet ticked line;
   *  the current beat is highlighted. Falls back to `label` when absent.
   *  When given as a plain string, the spine auto-glosses notation (O(n²), arr[i],
   *  …) via the notation bridge; pass JSX to control glossing by hand.
   *  (Scene layout only; ignored by the classic layout.) */
  takeaway?: Registered<ReactNode>;
}

/** A beat after register resolution — every prose field is a plain value. */
export interface ResolvedLessonBeat extends LessonBeatBase {
  connector?: string;
  panels: ResolvedLessonPanel[];
  detail?: ReactNode;
  actionLabel?: string;
  takeaway?: ReactNode;
}

/** Resolve a beat's prose for the active register (base fallback, skeleton untouched). */
export function resolveBeatForRegister(beat: LessonBeat, register: Register): ResolvedLessonBeat {
  return {
    ...beat,
    connector: pickRegister(beat.connector, register),
    panels: beat.panels.map((p) => ({
      ...p,
      label: pickRegister(p.label, register),
      title: pickRegister(p.title, register),
      body: pickRegister(p.body, register),
    })),
    detail: pickRegister(beat.detail, register),
    actionLabel: pickRegister(beat.actionLabel, register),
    takeaway: pickRegister(beat.takeaway, register),
  };
}

/**
 * Depth-adaptive beat selection (pure; the engine applies it before resolution).
 * `beat.registers` undefined = the beat appears for everyone; otherwise only for
 * the listed registers. goal === "refresh" additionally drops `trimOnRefresh`
 * beats. GUARD: a cut that would empty the lesson is discarded (full/pre-trim
 * list wins) — a learner must never meet a zero-beat lesson.
 */
export function filterBeatsForAudience(
  beats: LessonBeat[],
  register: Register,
  goal?: Goal,
): LessonBeat[] {
  const byRegister = beats.filter((bt) => !bt.registers || bt.registers.includes(register));
  let included = byRegister.length > 0 ? byRegister : beats;
  if (goal === "refresh") {
    const trimmed = included.filter((bt) => !bt.trimOnRefresh);
    if (trimmed.length > 0) included = trimmed;
  }
  return included;
}

/** Keep the current beat index inside the (possibly just-shrunk) beat list. */
export function clampBeatIndex(i: number, count: number): number {
  return Math.max(0, Math.min(i, count - 1));
}

export interface LessonSpec {
  topicTitle: string;
  /** Canvas design size; every beat draws inside this coordinate box. */
  canvas: { width: number; height: number };
  /** Raw `algorithm.py` source (with `@sync:` anchors) for the docked code panel. */
  codeSource: string;
  beats: LessonBeat[];
  /** One short "standing on the previous lesson" line, register-aware. Shown as a
   *  quiet italic line above the connector position on beat 0 only (scene layout). */
  bridgeFrom?: Registered<string>;
  /** The "idea n of total" principle stamp; `key` is the principle registry key —
   *  the chip links to `/principles/{key}`. Rendered on all beats (scene layout). */
  principle?: { key: string; n: number; total: number };
  /** Lesson layout. Default/undefined = "classic" (the established top-to-bottom
   *  composition used by every topic). "scene" opts into the immersive one-scene
   *  layout: hero diagram in a confidently-boxed plane, a collapsible right reading
   *  rail, an accreting "what we've established" spine, and a Focus Mode. "focus"
   *  opts into the single-column low-cognitive-load layout: one centered hero
   *  diagram + one caption, with the "why"/code/recap revealed on demand BELOW the
   *  caption (never over the always-pinned Back/Next). All three layouts share ONE
   *  engine; opt-in per topic — does not change any other topic. */
  layout?: "classic" | "scene" | "focus";
  /** Diagram shape hint for the focus layout's MOBILE treatment. "line" = a
   *  horizontal row/line whose meaning is the straight line (binary search, arrays,
   *  two-pointers, sliding-window, linked-list chain): on a phone the WHOLE line is
   *  fit to width so it never wraps and you watch it shrink. "box" = a 2-D figure
   *  (trees, graphs, grids, dp tables): scaled to fit the box (height-biased), as
   *  today. Default/undefined = "box". Ignored by classic/scene layouts. */
  diagramShape?: "line" | "box";
}
