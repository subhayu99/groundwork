import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { codeMaps } from "@/categories/code-maps";
import { listAllTopics } from "@/categories/registry";

/**
 * Guard the step→line maps that drive the code drawer's progressive reveal and
 * the live-emit fallback. Two failure modes this catches:
 *  1. A line number that points past the end of its `algorithm.py` (silent drift
 *     when a .py is edited but its map isn't).
 *  2. A topic missing a map entry (so the drawer would have nothing to reveal).
 */

const SRC = resolve(__dirname, "..");

function pyLineCount(category: string, topic: string): number {
  const path = resolve(SRC, "categories", category, "topics", topic, "algorithm.py");
  const src = readFileSync(path, "utf8");
  // Trailing newline shouldn't count as a referenceable line.
  return src.replace(/\n$/, "").split("\n").length;
}

describe("codeMaps", () => {
  it("has an entry for every registered topic", () => {
    const topics = listAllTopics();
    const missing = topics
      .map((t) => `${t.category}/${t.key}`)
      .filter((key) => !(key in codeMaps));
    expect(missing).toEqual([]);
  });

  it("references no line outside its algorithm.py", () => {
    const violations: string[] = [];

    for (const [key, stepMap] of Object.entries(codeMaps)) {
      const [category, topic] = key.split("/");
      const lineCount = pyLineCount(category, topic);

      for (const [step, lines] of Object.entries(stepMap)) {
        for (const line of lines) {
          if (line < 1 || line > lineCount) {
            violations.push(
              `${key} step ${step}: line ${line} out of range (file has ${lineCount} lines)`,
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("maps every step 1–7 for each topic", () => {
    const gaps: string[] = [];
    for (const [key, stepMap] of Object.entries(codeMaps)) {
      for (let step = 1; step <= 7; step++) {
        if (!stepMap[step] || stepMap[step].length === 0) {
          gaps.push(`${key} is missing step ${step}`);
        }
      }
    }
    expect(gaps).toEqual([]);
  });
});
