import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Cap, VW } from "../../_shared";
import operatorsPy from "./algorithm.py";

const ROWS = [
  { kind: "arithmetic", expr: "3 + 4 * 2", result: "11", tone: "accent" as const },
  { kind: "comparison", expr: "total > 10", result: "True", tone: "good" as const },
  { kind: "logical", expr: "is_big and total < 100", result: "True", tone: "good" as const },
];

const RY = 196, RH = 50, RGAP = 22, EX = 196, EW = 330, RES_X = 600, RES_W = 120;

/** show rows up to `upto` resolved; `active` is the focused row. */
function Rows({ upto, active }: { upto: number; active: number }) {
  return (
    <g>
      {ROWS.map((r, i) => {
        const y = RY + i * (RH + RGAP);
        const on = i === active;
        const resolved = i <= upto;
        const resTone = r.tone === "good" ? "var(--diff-easy)" : "var(--accent-line)";
        return (
          <g key={i} opacity={i <= Math.max(upto, active) ? 1 : 0.4} style={{ transition: "opacity .3s" }}>
            <text x={EX - 12} y={y + RH / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>{r.kind}</text>
            <rect x={EX} y={y} width={EW} height={RH} rx={10} fill={on ? "var(--accent-soft)" : "var(--bg-card)"} stroke={on ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={EX + EW / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 15, fill: "var(--text)" }}>{r.expr}</text>
            <text x={EX + EW + 18} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 16, fill: "var(--text-faint)" }}>=</text>
            <rect x={RES_X} y={y + RH / 2 - 18} width={RES_W} height={36} rx={9}
              fill={resolved ? (r.tone === "good" ? "color-mix(in oklab, var(--diff-easy) 14%, var(--bg-card))" : "var(--accent-soft)") : "var(--bg-card)"}
              stroke={resolved ? resTone : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={RES_X + RES_W / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 16, fill: resolved ? "var(--text)" : "var(--text-faint)" }}>{resolved ? r.result : "?"}</text>
          </g>
        );
      })}
    </g>
  );
}

export const operatorsLesson: LessonSpec = {
  topicTitle: "operators · combining values",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: operatorsPy as string,
  beats: [
    {
      id: "need",
      label: "Combine values",
      actionLabel: "Do the maths",
      takeaway: "Operators take values and produce a new one.",
      visual: <g><Cap>operators take values in and give a new value out</Cap><Rows upto={-1} active={-1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Combine values", title: "Turn values into new values.",
        body: <>Storing values is half of it; the other half is <strong>combining</strong> them. An <Term word="operator">operator</Term> like <code>+</code> or <code>&gt;</code> takes one or two values and works out a result. Three families do almost everything.</>,
      }],
      detail: <><p>An <Term word="expression">expression</Term> is any piece of code that works out to a value &mdash; <code>3 + 4 * 2</code>, <code>total &gt; 10</code>. Operators are how you build them.</p></>,
      codeLabels: ["arith"],
    },
    {
      id: "arith",
      label: "Arithmetic",
      connector: "Start with ordinary maths.",
      actionLabel: "Compare them",
      takeaway: "Arithmetic (+ - * / ) follows maths order: × and ÷ before + and −.",
      visual: <g><Cap>3 + 4 * 2 = 11, not 14 — multiply first, just like maths</Cap><Rows upto={0} active={0} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Arithmetic", title: "3 + 4 * 2  →  11",
        body: <>The familiar ones: <code>+ - * /</code>. They obey the same <strong>order</strong> you learned in school &mdash; <code>*</code> and <code>/</code> happen before <code>+</code> and <code>-</code> &mdash; so <code>3 + 4 * 2</code> is <code>11</code>. Use parentheses to force a different order.</>,
      }],
      detail: <><p>Two handy extras: <code>//</code> divides and drops the remainder (<code>7 // 2 = 3</code>), and <code>%</code> gives just the remainder (<code>7 % 2 = 1</code>). Both work on numbers (integers or decimals), not on text.</p></>,
      codeLabels: ["arith"],
    },
    {
      id: "compare",
      label: "Comparison",
      connector: "Now ask questions about values.",
      actionLabel: "Combine answers",
      takeaway: "Comparisons ( > < == ) produce a boolean — True or False.",
      visual: <g><Cap>{"total > 10  →  True · a comparison answers a yes/no question"}</Cap><Rows upto={1} active={1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Comparison", title: "total > 10  →  True",
        body: <>Comparison operators &mdash; <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>==</code> (equal), <code>!=</code> (not equal) &mdash; don&rsquo;t give a number. They give a <Term word="boolean">boolean</Term>: <code>True</code> or <code>False</code>.</>,
      }],
      detail: <><p>Note <code>==</code> (two equals, &ldquo;is it equal?&rdquo;) versus <code>=</code> (one equals, assignment). Mixing them up is a classic bug: <code>=</code> stores, <code>==</code> asks.</p></>,
      codeLabels: ["compare"],
    },
    {
      id: "logical",
      label: "Logical",
      connector: "And glue yes/no answers together.",
      actionLabel: "See it whole",
      takeaway: "and / or / not combine booleans into one True/False.",
      visual: <g><Cap>{"is_big and total < 100  →  True · both sides must be True for 'and'"}</Cap><Rows upto={2} active={2} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Logical", title: "is_big and total < 100  →  True",
        body: <><code>and</code>, <code>or</code>, <code>not</code> combine booleans. <code>and</code> is True only if <em>both</em> sides are; <code>or</code> if <em>either</em> is; <code>not</code> flips it. So you can ask compound questions in one go.</>,
      }],
      detail: <><p>This is how real conditions get expressive: <code>age &gt;= 18 and has_ticket</code>. The whole thing still works out to a single <code>True</code>/<code>False</code>.</p></>,
      codeLabels: ["logical"],
    },
    {
      id: "recap",
      label: "Three families",
      connector: "Step back and see the shape.",
      actionLabel: "Done",
      takeaway: "Arithmetic makes numbers; comparison & logical make booleans for decisions.",
      visual: <g><Cap>{"arithmetic → numbers  ·  comparison & logical → booleans"}</Cap><Rows upto={2} active={-1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Three families", title: "Numbers out, or booleans out.",
        body: <>Arithmetic gives you new <strong>numbers</strong>; comparison and logical give you <strong>booleans</strong>. Those booleans are exactly the fuel an <code>if</code> burns &mdash; which is where decisions come from.</>,
      }],
      detail: <><p>You now have values (variables, types) and ways to combine them (operators). Put a boolean operator inside an <code>if</code> and the program starts making choices &mdash; that&rsquo;s conditionals.</p></>,
      codeLabels: ["print"],
    },
  ],
};
