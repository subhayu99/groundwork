import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import conditionalsPy from "./algorithm.py";

const VW = 860, VH = 470;

type RowStatus = "idle" | "false" | "true" | "skipped";

const ROWS = [
  { cond: "score >= 90", out: 'grade = "A"' },
  { cond: "score >= 60", out: 'grade = "B"' },
  { cond: "else", out: 'grade = "F"' },
];

const X0 = 188, COND_W = 224, ARROW = 56, OUT_W = 196, ROW_H = 54, GAP = 20, Y0 = 196;

/* The if / elif / else ladder. Each row colours by status: a failed test goes red,
   the matched one goes accent, rows below a match are skipped (greyed). */
function Ladder({ status }: { status: RowStatus[] }) {
  return (
    <g>
      {/* the value being tested */}
      <rect x={VW / 2 - 70} y={150} width={140} height={30} rx={8} fill="var(--bg-card-hi)" stroke="var(--line-strong)" strokeWidth={1.5} />
      <text x={VW / 2} y={165} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>score = 72</text>

      {ROWS.map((r, i) => {
        const y = Y0 + i * (ROW_H + GAP);
        const st = status[i];
        const isElse = r.cond === "else";
        const condStroke = st === "false" ? "var(--diff-hard)" : st === "true" ? "var(--accent-line)" : "var(--line)";
        const condFill = st === "false" ? "color-mix(in oklab, var(--diff-hard) 12%, var(--bg-card))" : st === "true" ? "var(--accent-soft)" : "var(--bg-card)";
        const out = st === "true";
        const verdict = isElse
          ? (st === "skipped" ? "skipped" : st === "true" ? "(nothing matched)" : "")
          : st === "false" ? "False" : st === "true" ? "True" : "";
        const verdictColor = st === "false" ? "var(--diff-hard)" : st === "true" ? "var(--diff-easy)" : "var(--text-faint)";
        return (
          <g key={i} opacity={st === "idle" || st === "skipped" ? 0.5 : 1} style={{ transition: "opacity .3s" }}>
            <rect x={X0} y={y} width={COND_W} height={ROW_H} rx={10} fill={condFill} stroke={condStroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={X0 + COND_W / 2} y={y + (verdict ? ROW_H / 2 - 8 : ROW_H / 2)} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 14, fill: "var(--text)" }}>
              {isElse ? "else" : r.cond}
            </text>
            {verdict && (
              <text x={X0 + COND_W / 2} y={y + ROW_H / 2 + 11} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: verdictColor }}>{verdict}</text>
            )}
            <line x1={X0 + COND_W} y1={y + ROW_H / 2} x2={X0 + COND_W + ARROW} y2={y + ROW_H / 2} stroke={out ? "var(--accent-line)" : "var(--line)"} strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
            <rect x={X0 + COND_W + ARROW} y={y + ROW_H / 2 - 17} width={OUT_W} height={34} rx={9} fill={out ? "var(--accent-soft)" : "var(--bg-card)"} stroke={out ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={X0 + COND_W + ARROW + OUT_W / 2} y={y + ROW_H / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{r.out}</text>
            {i < ROWS.length - 1 && st === "false" && (
              <text x={X0 + COND_W / 2} y={y + ROW_H + GAP / 2 + 3} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>no &darr;</text>
            )}
          </g>
        );
      })}
    </g>
  );
}

const cap = (t: string) => (
  <text x={VW / 2} y={Y0 + 3 * (ROW_H + GAP) + 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>{t}</text>
);

export const conditionalsLesson: LessonSpec = {
  topicTitle: "if / else · choosing a path",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: conditionalsPy as string,
  beats: [
    {
      id: "need",
      label: "The choice",
      actionLabel: "Ask a question",
      takeaway: "A condition lets a program choose what to do, based on a value.",
      visual: <Ladder status={["idle", "idle", "idle"]} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The choice", title: "Turn a score into a grade.",
        body: <>Code that does the same thing every time can&rsquo;t react. Given a <code>score</code>, we want different results: 90+ is an A, 60+ is a B, otherwise F. The program has to <strong>choose</strong>.</>,
      }],
      detail: (
        <>
          <p>So far a program runs every line, top to bottom. To make it <em>decide</em>, we ask a yes/no question about a value and only run some lines when the answer is yes.</p>
          <p>Here the value is <code>score = 72</code>. Which grade should come out?</p>
        </>
      ),
      codeLabels: ["var"],
    },
    {
      id: "if",
      label: "if — the first test",
      connector: "Start with the top question and check it.",
      actionLabel: "It failed — now what?",
      takeaway: "if runs its block only when its condition is True.",
      visual: (
        <g>
          <Ladder status={["false", "idle", "idle"]} />
          {cap("72 >= 90 ?  →  False, so the A block is skipped")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "if — the first test", title: "if score >= 90:",
        body: <>An <Term word="if">if</Term> is a <Term word="condition">condition</Term> &mdash; a yes/no test. <code>score &gt;= 90</code> with <code>score = 72</code> is <strong>False</strong>, so the indented <code>grade = &quot;A&quot;</code> never runs.</>,
      }],
      detail: (
        <>
          <p>The <code>&gt;=</code> (&ldquo;greater than or equal&rdquo;) gives back a <Term word="boolean">boolean</Term> &mdash; <code>True</code> or <code>False</code>. <code>72 &gt;= 90</code> is <code>False</code>.</p>
          <p>The <strong>indented</strong> lines under the <code>if</code> are its block. They run only when the test is True &mdash; here, they&rsquo;re skipped entirely.</p>
        </>
      ),
      codeLabels: ["if", "a"],
    },
    {
      id: "elif",
      label: "elif — the next test",
      connector: "The first answer was no — so fall through to the next question.",
      actionLabel: "And if all fail?",
      takeaway: "elif checks the next condition only if the ones above were False.",
      visual: (
        <g>
          <Ladder status={["false", "true", "idle"]} />
          {cap("72 >= 60 ?  →  True, so grade = B  (and we stop checking)")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "elif — the next test", title: "elif score >= 60:",
        body: <><code>elif</code> (&ldquo;else if&rdquo;) is checked only because the <code>if</code> was False. <code>72 &gt;= 60</code> is <strong>True</strong>, so <code>grade = &quot;B&quot;</code> runs &mdash; and the ladder stops.</>,
      }],
      detail: (
        <>
          <p>Conditions are checked <strong>top to bottom</strong>. The moment one is True, its block runs and every remaining <code>elif</code>/<code>else</code> is ignored &mdash; even if a later one would also be True.</p>
          <p>That &ldquo;stop at the first match&rdquo; rule is why order matters: put the strictest test first.</p>
        </>
      ),
      codeLabels: ["elif", "b"],
    },
    {
      id: "else",
      label: "else — the fallback",
      connector: "What grade comes out when none of the tests pass?",
      actionLabel: "See it whole",
      takeaway: "else is the catch-all: it runs only when every test above was False.",
      visual: (
        <g>
          <Ladder status={["false", "true", "skipped"]} />
          {cap("else is skipped here — but it would catch a score like 40 → F")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "else — the fallback", title: "else:",
        body: <><code>else</code> has no condition &mdash; it&rsquo;s the <strong>otherwise</strong>. It runs when every <code>if</code>/<code>elif</code> above came out False. With <code>72</code> we already matched B, so <code>else</code> is skipped.</>,
      }],
      detail: (
        <>
          <p>If <code>score</code> were <code>40</code>: <code>40 &gt;= 90</code> False, <code>40 &gt;= 60</code> False &mdash; so <code>else</code> fires and <code>grade</code> becomes <code>&quot;F&quot;</code>.</p>
          <p><code>else</code> guarantees <em>some</em> branch always runs, so <code>grade</code> is never left unset.</p>
        </>
      ),
      codeLabels: ["else", "f"],
    },
    {
      id: "recap",
      label: "Exactly one path",
      connector: "Read the whole ladder as one decision.",
      actionLabel: "Done",
      takeaway: "if / elif / else: tests run top-to-bottom, exactly one branch wins.",
      visual: (
        <g>
          <Ladder status={["false", "true", "skipped"]} />
          {cap("✓ exactly one branch runs · grade = B")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Exactly one path", title: "One question, one answer.",
        body: <>An <code>if / elif / else</code> chain is a single decision: Python walks the tests top to bottom and runs the <strong>first</strong> block whose condition is True &mdash; exactly one, then continues with <code>print</code>.</>,
      }],
      detail: (
        <>
          <p>You now have the two halves of every program: <strong>remember</strong> values (variables) and <strong>decide</strong> with them (conditions). Next we&rsquo;ll make the program <em>repeat</em> work with loops.</p>
        </>
      ),
      codeLabels: ["print"],
    },
  ],
};
