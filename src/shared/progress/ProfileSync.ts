import { ProgressState, PROGRESS_SCHEMA_VERSION } from "./types";
import { migrate } from "./migrate";

/**
 * THE SYNC SEAM (L4.2 — accounts-READY, build-nothing-now).
 *
 * Identity today is localStorage-only (a churn bomb: device loss = progress
 * loss). The actual backend is PARKED (P10 — trigger: Subhayu's go after the
 * sync-code explainer / freemium decision). This file defines the seam so it
 * drops in later WITHOUT a remodel:
 *
 *   1. `ProfileSync` — the only interface a backend must implement.
 *      • Phase A (sync-code KV): pull/push the serialized envelope against a
 *        keyed KV store ("enter your sync code on the new device").
 *      • Phase B (magic-link accounts): same two methods against an
 *        authenticated profile endpoint.
 *   2. `serializeState` / `deserializeState` — the wire format: a versioned
 *      envelope `{ v, exportedAt, state }`. Deserialization ALWAYS runs
 *      `migrate()`, so any historical envelope (or bare v1/v2 blob — his
 *      existing exported backups) loads under THE RULE (H10): never silently
 *      drop categories data; salvage what parses.
 *   3. `NullSync` — the no-op default wired today. Swapping it for a real
 *      implementation + a merge-on-pull (ProgressStore.importJson already
 *      merges by more-complete-topic) is the entire integration.
 *
 * Nothing here talks to a network. Build nothing now.
 */
export interface ProfileSync {
  /** Fetch the remote state, or null when none exists (new sync code /
   *  first login / no backend). */
  pull(): Promise<ProgressState | null>;
  /** Persist the full state remotely. Callers pass the merged local truth. */
  push(state: ProgressState): Promise<void>;
}

/** Versioned wire envelope. `v` records the schema version the state was
 *  exported at; `deserializeState` migrates whatever it finds. */
export interface ProgressEnvelope {
  v: number;
  exportedAt: string;
  state: ProgressState;
}

/** Serialize to the versioned envelope (pretty-printed — doubles as the
 *  user-facing backup download). */
export function serializeState(state: ProgressState): string {
  const envelope: ProgressEnvelope = {
    v: PROGRESS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parse an envelope OR a bare ProgressState blob (pre-envelope v1/v2 exports
 * keep working forever). Runs `migrate()` on the payload, so the result is
 * always a valid current-version state. Throws only when the input is not
 * JSON or not an object at all — there is nothing to salvage then, and the
 * import UI should surface an error rather than silently no-op.
 */
export function deserializeState(json: string): ProgressState {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Not a progress backup: expected a JSON object");
  }
  const payload = isEnvelope(parsed) ? parsed.state : parsed;
  return migrate(payload);
}

function isEnvelope(v: object): v is ProgressEnvelope {
  return (
    "state" in v &&
    typeof (v as { state: unknown }).state === "object" &&
    (v as { state: unknown }).state !== null &&
    "v" in v
  );
}

/** The wired-today no-op: no backend, nothing pulled, pushes vanish. */
export class NullSync implements ProfileSync {
  async pull(): Promise<ProgressState | null> {
    return null;
  }
  async push(_state: ProgressState): Promise<void> {
    // no-op until P10 lands a backend
  }
}
