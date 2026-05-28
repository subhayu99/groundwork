"use client";

import { useMemo, useState } from "react";
import { CodeHighlight } from "./CodeHighlight";
import { ScrubBar } from "./ScrubBar";

interface Props {
  code: string;
  filename?: string;
}

/**
 * The code drawer body: a scrub bar that walks an active-line highlight
 * down the file, with the highlighted line shown in CodeHighlight.
 * Lines are 1-indexed. Blank lines are skipped so the active highlight
 * always lands on something readable.
 */
export function ScrubbableCode({ code, filename = "algorithm.py" }: Props) {
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const total = lines.length;

  // Lines worth landing on (non-blank). Scrubbing snaps to these.
  const stops = useMemo(
    () =>
      lines
        .map((l, i) => ({ l, n: i + 1 }))
        .filter(({ l }) => l.trim().length > 0)
        .map(({ n }) => n),
    [lines],
  );

  const lastStop = stops[stops.length - 1] ?? total;
  const [current, setCurrent] = useState(stops[0] ?? 1);
  const [playing, setPlaying] = useState(false);

  // Snap an arbitrary line to the nearest meaningful stop at or after it.
  // Past the final stop we clamp to it so Play always terminates.
  const snap = (line: number) => {
    const clamped = Math.max(1, Math.min(total, line));
    const next = stops.find((s) => s >= clamped);
    setCurrent(next ?? lastStop);
  };

  const header = (
    <ScrubBar
      currentLine={current}
      totalLines={lastStop}
      playing={playing}
      onLineChange={(line) => snap(line)}
      onPlayToggle={() => setPlaying((p) => !p)}
      onReset={() => {
        setPlaying(false);
        setCurrent(stops[0] ?? 1);
      }}
    />
  );

  return <CodeHighlight code={code} highlightedLines={[current]} header={header} />;
}
