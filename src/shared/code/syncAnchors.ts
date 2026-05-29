/**
 * Code↔visualization sync — single source of truth.
 *
 * The algorithm's `.py` file is the ONLY place line identity lives. Executable
 * lines are tagged with a `@sync:` anchor, e.g.
 *
 *     mid = (lo + hi) // 2          # @sync: mid
 *     lo = mid + 1                  # right half @sync: lo_update
 *
 * Visualizers and `code-maps.ts` then refer to lines by **label** ("mid"),
 * never by a hand-maintained line number — so when the `.py` changes, the
 * highlight follows automatically and the two can never drift (the old bug:
 * `code-maps.ts` line numbers + per-visualizer `LINE_*` constants forking).
 *
 * `prepareCode` strips the `@sync:` markers for display (line numbers are
 * preserved) and returns the label→line index. Resolution is tolerant of raw
 * line numbers too, so topics can be migrated one at a time while the app
 * stays green; once every topic uses labels, the number path can be removed.
 */

const ANCHOR_RE = /@sync:\s*([\w-]+(?:\s*,\s*[\w-]+)*)/;

export interface PreparedCode {
  /** Source with `@sync:` markers stripped — what the code panel renders. */
  code: string;
  /** label → 1-indexed line number, resolved against this file. */
  labelToLine: Record<string, number>;
}

/** Remove a `@sync: …` marker from one line and tidy a now-empty trailing comment. */
function stripAnchor(line: string): string {
  let out = line.replace(/\s*@sync:\s*[\w-]+(?:\s*,\s*[\w-]+)*/, "");
  // If stripping left a dangling empty comment (`code   #`), drop the `#`.
  out = out.replace(/\s*#\s*$/, "");
  return out;
}

/** Parse a `.py` once: strip anchors for display, build the label→line index. */
export function prepareCode(raw: string): PreparedCode {
  const srcLines = raw.replace(/\n$/, "").split("\n");
  const labelToLine: Record<string, number> = {};
  const display = srcLines.map((line, i) => {
    const m = line.match(ANCHOR_RE);
    if (m) {
      for (const label of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        labelToLine[label] = i + 1;
      }
      return stripAnchor(line);
    }
    return line;
  });
  return { code: display.join("\n"), labelToLine };
}

/**
 * Resolve a mix of labels (preferred) and raw line numbers to 1-indexed line
 * numbers, deduped and sorted. Unknown labels are dropped (and surfaced in dev).
 */
export function resolveLines(
  tokens: ReadonlyArray<string | number> | undefined,
  labelToLine: Record<string, number>,
): number[] | undefined {
  if (!tokens || tokens.length === 0) return undefined;
  const out = new Set<number>();
  for (const t of tokens) {
    if (typeof t === "number") {
      out.add(t);
    } else if (t in labelToLine) {
      out.add(labelToLine[t]);
    } else if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[sync] unknown code label "${t}" — no @sync anchor found`);
    }
  }
  return out.size ? [...out].sort((a, b) => a - b) : undefined;
}

/** A step→tokens map for one topic (tokens are labels, or legacy line numbers). */
export type TopicSyncMap = Record<number, ReadonlyArray<string | number>>;
