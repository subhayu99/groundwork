import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Box, Cap, VW } from "../../_shared";
import functionsPy from "./algorithm.py";

const MX = 350, MY = 214, MW = 220, MH = 108;

/** The function as a machine: inputs flow in on the left, the result comes out the right. */
function Machine({ wv, hv, out, lit }: { wv: string; hv: string; out: string; lit?: boolean }) {
  const inChip = (y: number, label: string) => (
    <g>
      <rect x={150} y={y} width={120} height={34} rx={8} fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1.5} />
      <text x={210} y={y + 17} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{label}</text>
      <line x1={270} y1={y + 17} x2={MX} y2={y + 17} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" opacity={0.6} />
    </g>
  );
  return (
    <g>
      {inChip(MY + 14, wv)}
      {inChip(MY + 60, hv)}
      <rect x={MX} y={MY} width={MW} height={MH} rx={14} fill={lit ? "var(--accent-soft)" : "var(--bg-card-hi)"} stroke={lit ? "var(--accent-line)" : "var(--line-strong)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={MX + MW / 2} y={MY + 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>area(width, height)</text>
      <text x={MX + MW / 2} y={MY + 64} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)" }}>return</text>
      <text x={MX + MW / 2} y={MY + 84} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)" }}>width * height</text>
      <line x1={MX + MW} y1={MY + MH / 2} x2={615} y2={MY + MH / 2} stroke={out === "?" ? "var(--line)" : "var(--accent-line)"} strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
      <Box x={615} y={MY + MH / 2 - 20} w={110} h={40} value={out} active={out !== "?"} tone="good" />
    </g>
  );
}

export const functionsLesson: LessonSpec = {
  topicTitle: "functions · inputs in, answer out",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: functionsPy as string,
  beats: [
    {
      id: "need",
      label: "Name a set of steps",
      actionLabel: "Define it",
      takeaway: "A function packages steps under a name so you reuse, not repeat.",
      visual: <g><Cap>the same calculation, needed in many places</Cap><Machine wv="width" hv="height" out="?" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Name a set of steps", title: "Bottle up a calculation.",
        body: <>You keep needing the same steps &mdash; the area of a room, then a hall, then a desk. Copy-pasting <code>width * height</code> everywhere is error-prone. A <Term word="function">function</Term> lets you write it <strong>once</strong>, give it a name, and reuse it.</>,
      }],
      detail: <><p>Think of a machine: you feed values in, it does its work, and hands a result back. Define the machine once; press its button as often as you like.</p></>,
      codeLabels: ["def"],
    },
    {
      id: "define",
      label: "def — the recipe",
      connector: "First write the machine, with blanks for its inputs.",
      actionLabel: "Press the button",
      takeaway: "def names the function; its parameters are blanks filled in later.",
      visual: <g><Cap>def area(width, height): return width * height   ·   not run yet</Cap><Machine wv="width" hv="height" out="?" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "def — the recipe", title: "def area(width, height):",
        body: <><code>def</code> defines a function. <code>width</code> and <code>height</code> are <Term word="parameter">parameters</Term> &mdash; named blanks for the inputs. The indented body is the recipe; <code>def</code> just stores it &mdash; nothing runs yet.</>,
      }],
      detail: <><p>The <code>return</code> line says what the function hands back. Defining is like writing a recipe card and filing it away &mdash; no cooking happens until someone actually calls it.</p></>,
      codeLabels: ["def", "return"],
    },
    {
      id: "call",
      label: "call — fill the blanks",
      connector: "Now actually use it with real values.",
      actionLabel: "Use it again",
      takeaway: "Calling fills the parameters with arguments; return hands a value back.",
      visual: <g><Cap>area(4, 3): width = 4, height = 3 → returns 12</Cap><Machine wv="4" hv="3" out="12" lit /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "call — fill the blanks", title: "room = area(4, 3)",
        body: <>Writing <code>area(4, 3)</code> <strong>calls</strong> it: <code>4</code> fills <code>width</code>, <code>3</code> fills <code>height</code> (these are the <Term word="argument">arguments</Term>). The body runs, <code>return</code> hands back <code>12</code>, and that value lands in <code>room</code>.</>,
      }],
      detail: <><p>The returned value <em>replaces</em> the call: <code>room = area(4, 3)</code> becomes <code>room = 12</code>. A function call is just an expression that stands in for whatever it returns.</p></>,
      codeLabels: ["call1", "return"],
    },
    {
      id: "reuse",
      label: "Reuse it",
      connector: "Same machine, brand new inputs.",
      actionLabel: "Sum up",
      takeaway: "Define once, call many times with different inputs.",
      visual: <g><Cap>area(10, 2) → 20   ·   one definition, any inputs</Cap><Machine wv="10" hv="2" out="20" lit /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Reuse it", title: "hall = area(10, 2)  →  20",
        body: <>Call it again with different arguments and you get a different answer &mdash; <code>20</code> &mdash; from the very same definition. That&rsquo;s the whole point: write the logic once, reuse it everywhere.</>,
      }],
      detail: <><p>If the formula ever changes, you fix it in <strong>one</strong> place and every call updates. Functions are how programs stay small even as they do more.</p></>,
      codeLabels: ["call2"],
    },
    {
      id: "recap",
      label: "Inputs in, answer out",
      connector: "The shape of every function.",
      actionLabel: "Done",
      takeaway: "Functions: inputs (arguments) in, one result (return) out, reusable.",
      visual: <g><Cap>room = 12, hall = 20 — two calls, one definition</Cap><Machine wv="4 · 10" hv="3 · 2" out="12·20" lit /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Inputs in, answer out", title: "Define once, call anywhere.",
        body: <>A function is a named machine: arguments go in, the body runs, a value comes back via <code>return</code>. It turns &ldquo;a block of steps&rdquo; into &ldquo;one word you can reuse.&rdquo;</>,
      }],
      detail: <><p>Functions are also how you tame complexity: each one hides its steps behind a name, so bigger programs read as a few clear calls. Nearly all the code you&rsquo;ll meet lives inside functions.</p></>,
      codeLabels: ["print"],
    },
  ],
};
