import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import variablesPy from "./algorithm.py";

const VW = 860, VH = 470;
const BOX_W = 150, BOX_H = 66;

/* A labelled box: the variable's name floats above, its current value sits inside. */
function VarBox({ x, y, name, value, active, w = BOX_W }: { x: number; y: number; name: string; value: string; active?: boolean; w?: number }) {
  return (
    <g>
      <text x={x + w / 2} y={y - 12} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: active ? "var(--accent-ink)" : "var(--text-muted)" }}>{name}</text>
      <rect x={x} y={y} width={w} height={BOX_H} rx={12} fill={active ? "var(--accent-soft)" : "var(--bg-card)"} stroke={active ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x + w / 2} y={y + BOX_H / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 20, fill: value === "?" ? "var(--text-faint)" : "var(--text)" }}>{value}</text>
    </g>
  );
}

const caption = (t: string, x = VW / 2, y = 168) => (
  <text x={x} y={y} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-faint)" }}>{t}</text>
);

/* y for the single/centred box row */
const BY = 224;

export const variablesLesson: LessonSpec = {
  topicTitle: "variables · a labelled box",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: variablesPy as string,
  beats: [
    {
      id: "need",
      label: "The need",
      actionLabel: "Make a box",
      takeaway: "A program needs to remember values to use them later.",
      visual: (
        <g>
          {caption("you need to remember a number to use later")}
          <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="?" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The need", title: "Hold onto a value.",
        body: <>A program that can&rsquo;t remember anything can&rsquo;t do much. You need a place to <strong>keep a value</strong> &mdash; a player&rsquo;s score, a name, a total &mdash; and get it back later.</>,
      }],
      detail: (
        <>
          <p>Think of a labelled box. You write a name on it &mdash; <code>score</code> &mdash; and you can drop a value inside, look at what&rsquo;s in there whenever you want, and swap it for something new.</p>
          <p>That box is a <strong>variable</strong>. Everything else in programming is built on top of remembering values this way.</p>
        </>
      ),
      codeLabels: ["create"],
    },
    {
      id: "create",
      label: "Create it",
      connector: "So we make the box and put something in it.",
      actionLabel: "Now change it",
      takeaway: "name = value stores a value under that name.",
      visual: (
        <g>
          {caption("score = 0   →   the value 0 goes into the box named score")}
          <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="0" active />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Create it", title: "score = 0",
        body: <>Write the name, an <code>=</code>, then the value. <code>score = 0</code> makes a box called <code>score</code> and puts <code>0</code> in it.</>,
      }],
      detail: (
        <>
          <p>The <code>=</code> here is <strong>not</strong> &ldquo;equals&rdquo; like in maths. It&rsquo;s an <Term word="assignment">assignment</Term>: &ldquo;take the value on the right and store it in the name on the left.&rdquo;</p>
          <p>Read it right-to-left: compute <code>0</code>, then put it in <code>score</code>.</p>
        </>
      ),
      codeLabels: ["create"],
    },
    {
      id: "update",
      label: "Change it",
      connector: "The whole point of a box is that what's inside can change.",
      actionLabel: "Use the value",
      takeaway: "Reassigning replaces the old value — right side first, then store.",
      visual: (
        <g>
          {caption("score = score + 10   →   read 0, add 10, put 10 back")}
          <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="10" active />
          <text x={VW / 2} y={BY + BOX_H + 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>0 + 10 = 10 &mdash; the old 0 is gone</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Change it", title: "score = score + 10",
        body: <>The right side is worked out <em>first</em> using the current value, then the answer is stored back. <code>score</code> was <code>0</code>, so this puts <code>10</code> in.</>,
      }],
      detail: (
        <>
          <p>This looks strange as maths (<code>score = score + 10</code>?!) but makes perfect sense as assignment: <strong>read</strong> the current <code>score</code> (0), <strong>add</strong> 10, then <strong>store</strong> the result (10) back in the same box.</p>
          <p>The previous value is simply overwritten &mdash; a box only ever holds one thing at a time.</p>
        </>
      ),
      codeLabels: ["update"],
    },
    {
      id: "use",
      label: "Use it",
      connector: "Once a value is stored, you can read it anywhere — including to make new values.",
      actionLabel: "Hold other things",
      takeaway: "Read a variable by name; it stands in for its value.",
      visual: (
        <g>
          {caption("bonus = score * 2   →   read score (10), make a new box")}
          <VarBox x={200} y={BY} name="score" value="10" />
          <VarBox x={510} y={BY} name="bonus" value="20" active />
          {/* flow arrow score -> bonus */}
          <line x1={200 + BOX_W} y1={BY + BOX_H / 2} x2={510} y2={BY + BOX_H / 2} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
          <text x={(200 + BOX_W + 510) / 2} y={BY + BOX_H / 2 - 10} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>&times; 2</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Use it", title: "bonus = score * 2",
        body: <>Using a variable just means writing its name. <code>score</code> stands in for its value (<code>10</code>), so <code>score * 2</code> is <code>20</code> &mdash; stored in a brand-new box, <code>bonus</code>.</>,
      }],
      detail: (
        <>
          <p>Wherever you write <code>score</code>, the program swaps in whatever value the box currently holds. Reading it doesn&rsquo;t empty the box &mdash; <code>score</code> is still <code>10</code> afterwards.</p>
        </>
      ),
      codeLabels: ["use"],
    },
    {
      id: "types",
      label: "Any kind of value",
      connector: "Boxes aren't only for numbers.",
      actionLabel: "See it together",
      takeaway: "A variable can hold any type of value — numbers, text, more.",
      visual: (
        <g>
          {caption("name = \"Ada\"   →   a box can hold text too")}
          <VarBox x={(VW - 180) / 2} y={BY} name="name" value="Ada" active w={180} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Any kind of value", title: 'name = "Ada"',
        body: <>The same idea holds any kind of value. Text (in quotes) is a <Term word="string">string</Term>; you&rsquo;ve already seen whole numbers. The box doesn&rsquo;t care what it holds.</>,
      }],
      detail: (
        <>
          <p>Numbers, text, <Term word="boolean"><code>True</code>/<code>False</code></Term>, and bigger things later (lists, and so on) all live in variables the same way. The quotes around <code>&quot;Ada&quot;</code> are how Python knows it&rsquo;s text, not a name to look up.</p>
        </>
      ),
      codeLabels: ["another"],
    },
    {
      id: "recap",
      label: "Put together",
      connector: "Three boxes, each remembering one value — that's a tiny program.",
      actionLabel: "Done",
      takeaway: "Variables are named boxes you read, reuse, and reassign.",
      visual: (
        <g>
          {caption("three named boxes — the program's memory")}
          <VarBox x={120} y={BY} name="score" value="10" />
          <VarBox x={355} y={BY} name="bonus" value="20" />
          <VarBox x={590} y={BY} name="name" value="Ada" />
          <text x={VW / 2} y={BY + BOX_H + 34} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>print(name, score, bonus)  &rarr;  Ada 10 20</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Put together", title: "The program's memory",
        body: <>Each line made or changed a box; together they&rsquo;re what the program <em>remembers</em>. <code>print</code> just reads the boxes back out.</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the whole idea: a variable is a <strong>name bound to a value</strong>. Create with <code>=</code>, read by writing the name, change by assigning again.</p>
          <p>Tip: when a value should <em>never</em> change, programmers write its name in <code>UPPER_CASE</code> (like <code>MAX_SCORE = 100</code>) as a signal &mdash; that&rsquo;s a <Term word="constant">constant</Term>.</p>
        </>
      ),
      codeLabels: ["read"],
    },
  ],
};
