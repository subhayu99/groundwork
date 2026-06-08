import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Box, Cap, VW } from "../../_shared";
import whilePy from "./algorithm.py";

const ROUNDS = [
  "count = 0    →    0 < 3  ✓    →    print 0,  count → 1",
  "count = 1    →    1 < 3  ✓    →    print 1,  count → 2",
  "count = 2    →    2 < 3  ✓    →    print 2,  count → 3",
];
const EXIT = "count = 3    →    3 < 3  ✗    →    stop the loop";
const RY = 196, RH = 44, RGAP = 12, RX = 150, RW = 560;

function Row({ i, text, tone = "accent", state }: { i: number; text: string; tone?: "accent" | "bad"; state: "idle" | "on" | "done" }) {
  const y = RY + i * (RH + RGAP);
  const stroke = state === "idle" ? "var(--line)" : tone === "bad" ? "var(--diff-hard)" : "var(--accent-line)";
  const fill = state === "on" ? (tone === "bad" ? "color-mix(in oklab, var(--diff-hard) 12%, var(--bg-card))" : "var(--accent-soft)") : "var(--bg-card)";
  return (
    <g opacity={state === "idle" ? 0.45 : 1} style={{ transition: "opacity .3s" }}>
      <rect x={RX} y={y} width={RW} height={RH} rx={10} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={RX + RW / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{text}</text>
    </g>
  );
}

const trace = (rounds: ("idle" | "on" | "done")[], exit?: "idle" | "on" | "done") => (
  <g>
    {ROUNDS.map((t, i) => <Row key={i} i={i} text={t} state={rounds[i]} />)}
    {exit && <Row i={3} text={EXIT} tone="bad" state={exit} />}
  </g>
);

export const whileLoopsLesson: LessonSpec = {
  topicTitle: "while loops · repeat while true",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: whilePy as string,
  beats: [
    {
      id: "need",
      label: "Repeat without copying",
      actionLabel: "Set it up",
      takeaway: "A loop repeats a block so you don't copy-paste it.",
      visual: <g><Cap>do the same thing many times — without writing it many times</Cap>{trace(["idle", "idle", "idle"])}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Repeat without copying", title: "Repetition, written once.",
        body: <>To print <code>0</code>, <code>1</code>, <code>2</code> you could write three lines &mdash; but for a thousand? You need a way to say &ldquo;keep doing this&rdquo; once, and let the computer repeat it.</>,
      }],
      detail: <><p>A <Term word="loop">loop</Term> runs the same block of code again and again. The <code>while</code> loop is the most basic kind: it repeats <strong>as long as a condition is True</strong>.</p></>,
      codeLabels: ["init"],
    },
    {
      id: "setup",
      label: "A counter + a test",
      connector: "Every while loop needs two things to start.",
      actionLabel: "Run it",
      takeaway: "while needs a starting value and a condition to check each round.",
      visual: (
        <g>
          <Cap>count starts at 0; the loop will run while count &lt; 3</Cap>
          <Box x={(VW - 150) / 2} y={232} w={150} name="count" value="0" active />
          <text x={VW / 2} y={336} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 14, fill: "var(--accent-ink)" }}>while count &lt; 3:</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "A counter + a test", title: "count = 0   ·   while count < 3:",
        body: <>First a starting value: <code>count = 0</code>. Then the <code>while</code> with a <Term word="condition">condition</Term>: <code>count &lt; 3</code>. The indented block below runs every time that test is True.</>,
      }],
      detail: <><p>It&rsquo;s like an <code>if</code> that keeps re-asking. Before each round Python checks the condition; if True, it runs the block, then checks again.</p></>,
      codeLabels: ["init", "cond"],
    },
    {
      id: "run",
      label: "Round by round",
      connector: "Watch it actually run.",
      actionLabel: "When does it stop?",
      takeaway: "Each round: check the condition, run the block, then check again.",
      visual: <g><Cap>all three rounds, side by side — each one: check, run the block, then loop back</Cap>{trace(["on", "on", "on"])}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Round by round", title: "Check → run → repeat.",
        body: <>Round 1: <code>0 &lt; 3</code> is True, so it prints <code>0</code> and bumps <code>count</code> to <code>1</code>. Round 2 with <code>1</code>, round 3 with <code>2</code> &mdash; each time it loops back to the test.</>,
      }],
      detail: <><p>The line <code>count = count + 1</code> is doing the crucial work: it moves the counter <strong>toward</strong> the condition becoming False. Without it, the test would stay True forever.</p></>,
      codeLabels: ["cond", "body", "step"],
    },
    {
      id: "exit",
      label: "The exit",
      connector: "So what finally ends it?",
      actionLabel: "The catch",
      takeaway: "When the condition turns False, the loop ends and code continues.",
      visual: <g><Cap>count is now 3 → 3 &lt; 3 is False → the loop stops</Cap>{trace(["done", "done", "done"], "on")}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The exit", title: "3 < 3  →  False  →  stop",
        body: <>After the third round <code>count</code> is <code>3</code>. Now <code>3 &lt; 3</code> is <strong>False</strong>, so the block is skipped and the program moves on to whatever comes after the loop.</>,
      }],
      detail: <><p>The danger: if the condition can <em>never</em> become False (you forget <code>count = count + 1</code>), the loop runs forever &mdash; an <Term word="infinite loop">infinite loop</Term>. Every <code>while</code> must make progress toward its exit.</p></>,
      codeLabels: ["step", "after"],
    },
    {
      id: "recap",
      label: "Repeat while true",
      connector: "The whole shape, in one view.",
      actionLabel: "Done",
      takeaway: "while = repeat while a condition holds; make progress toward False.",
      visual: <g><Cap>✓ printed 0, 1, 2 — then stopped</Cap>{trace(["done", "done", "done"], "done")}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Repeat while true", title: "Repeat while the condition holds.",
        body: <>A <code>while</code> loop is a question asked over and over: while it&rsquo;s True, run the block; the moment it&rsquo;s False, stop. The body must nudge the world toward that False, or it never ends.</>,
      }],
      detail: <><p><code>while</code> is perfect when you don&rsquo;t know how many rounds you&rsquo;ll need (&ldquo;until the user quits&rdquo;). When you&rsquo;re going through a <em>known</em> set of things one by one, the <strong>for</strong> loop is cleaner &mdash; that&rsquo;s next.</p></>,
      codeLabels: ["after"],
    },
  ],
};
