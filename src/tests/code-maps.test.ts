import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { codeMaps } from "@/categories/code-maps";
import { listAllTopics } from "@/categories/registry";
import { prepareCode, resolveLines } from "@/shared/code/syncAnchors";

/**
 * Guards the step→code maps that drive the code drawer. Tokens are `@sync:`
 * LABELS (resolved against algorithm.py) or legacy raw line numbers. Failure
 * modes caught:
 *  1. a topic with no map entry (drawer has nothing to reveal);
 *  2. a token that resolves to no line (drifted label / out-of-range number);
 *  3. a token that resolves to a COMMENT or BLANK line (the "highlight a `#`
 *     comment as if it ran" bug) — labels must point at executable code;
 *  4. a step (1–7) with no mapping.
 */

const SRC = resolve(__dirname, "..");

function loadTopic(category: string, topic: string) {
  const path = resolve(SRC, "categories", category, "topics", topic, "algorithm.py");
  const raw = readFileSync(path, "utf8");
  return prepareCode(raw); // { code (anchors stripped), labelToLine }
}

describe("codeMaps", () => {
  it("has an entry for every registered topic", () => {
    const missing = listAllTopics()
      .map((t) => `${t.category}/${t.key}`)
      .filter((key) => !(key in codeMaps));
    expect(missing).toEqual([]);
  });

  it("every token resolves to a real, executable (non-comment) line", () => {
    const violations: string[] = [];

    for (const [key, stepMap] of Object.entries(codeMaps)) {
      const [category, topic] = key.split("/");
      const { code, labelToLine } = loadTopic(category, topic);
      const displayLines = code.split("\n");

      for (const [step, tokens] of Object.entries(stepMap)) {
        for (const token of tokens) {
          const resolved = resolveLines([token], labelToLine);
          if (resolved === undefined) {
            violations.push(`${key} step ${step}: unresolved token ${JSON.stringify(token)}`);
            continue;
          }
          const isLabel = typeof token === "string";
          for (const line of resolved) {
            if (line < 1 || line > displayLines.length) {
              violations.push(`${key} step ${step}: line ${line} out of range (${displayLines.length})`);
              continue;
            }
            // Strict for migrated (label) topics: a label must point at real,
            // executable code — never a comment/blank. Legacy numeric tokens
            // are range-checked only until migrated.
            if (isLabel) {
              const text = (displayLines[line - 1] ?? "").trim();
              if (text === "" || text.startsWith("#")) {
                violations.push(`${key} step ${step}: label ${JSON.stringify(token)} → line ${line} is a comment/blank: "${text.slice(0, 40)}"`);
              }
            }
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
        if (!stepMap[step] || stepMap[step].length === 0) gaps.push(`${key} is missing step ${step}`);
      }
    }
    expect(gaps).toEqual([]);
  });
});
