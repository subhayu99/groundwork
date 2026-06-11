"use client";

import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Box, Chip, Cap, VW } from "../../_shared";
import dataTypesPy from "./algorithm.py";

const BY = 214, BW = 150, GAP = 40;

/** A value box with its type chip underneath. */
function Typed({ x, name, value, type, active, tone }: { x: number; name: string; value: string; type: string; active?: boolean; tone?: "accent" | "good" }) {
  return (
    <g>
      <Box x={x} y={BY} w={BW} name={name} value={value} active={active} tone={tone} />
      <Chip x={x + (BW - 86) / 2} y={BY + 80} w={86} text={type} tone={active ? "accent" : "muted"} />
    </g>
  );
}

const four = (active: number) => {
  const totalW = 4 * BW + 3 * GAP, x0 = (VW - totalW) / 2;
  const items = [
    { name: "age", value: "7", type: "int" },
    { name: "price", value: "3.14", type: "float" },
    { name: "name", value: "“Ada”", type: "str" },
    { name: "is_adult", value: "False", type: "bool" },
  ];
  return (
    <g>
      {items.map((it, i) => (
        <Typed key={i} x={x0 + i * (BW + GAP)} name={it.name} value={it.value} type={it.type} active={i === active} />
      ))}
    </g>
  );
};

/* ── prediction gate (the wedge): int and float were told apart by SPELLING
 *    alone (the dot), and quotes are the next spelling rule. Before the
 *    `"7"`-is-text reveal lands (it lives in this beat's detail and in the
 *    recap), the learner commits to what quotes do to digits. Hosted in a
 *    <foreignObject> per Predict.tsx (panels are pointer-events-none — the
 *    canvas is the one host every viewport shares). The transparent <rect>
 *    twin keeps the scene layout's auto-centring honest about the gate's
 *    footprint. ──────────────────────────────────────────────────────────── */
const GATE = { x: 190, y: 332, w: 480, h: 138 };

function QuotedDigitsGate({ api }: { api: BeatVisualApi }) {
  return (
    <g>
      <Cap>"Ada" is a str — the quotes are how Python knows it's text</Cap>
      {four(2)}
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question='Quotes make "Ada" text. So "7" — digits in quotes — is…'
          choices={[
            { id: "number", label: "still the number 7", note: 'the quotes win — "7" is text, and maths on it fails until int("7") converts it' },
            { id: "string", label: "text — a string", correct: true, note: "how you write it decides the kind — quotes make text, even out of digits" },
            { id: "error", label: "an error", note: "Python will quote anything — the result is simply text that happens to be a digit" },
          ]}
          api={api}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, numbers, text, bool, recap)
 *   structured : all 5 — this catalogue lesson is already lean (preset 4–5)
 *   rigorous   : 2 — `text` (the model: syntax fixes type + the invariant,
 *                  gate included) + `recap` (edge cases folded in + the
 *                  stamped close); int/float/bool essentials fold into
 *                  those two beats' rigorous prose.
 *   refresh    : additionally trims `need` + `numbers` (trimOnRefresh).        */
export const dataTypesLesson: LessonSpec = {
  topicTitle: "data types · kinds of value",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: dataTypesPy as string,
  // standing on variables (TRACK-NARRATIVES row 3): a name remembers one
  // value — this lesson looks at what KINDS of value a name can hold.
  bridgeFrom: reg({
    base: "A variable names one value you can read and reassign — now meet the kinds those values come in.",
    intuitive: "You can make a named box and drop any value inside — now look closer at the kinds of value that go in.",
    rigorous: "A name binds one value — and every value carries a type: a standing guarantee of what it can do.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 3): a type is a standing
  // guarantee about what a value can do — the SEED of idea 3 (invariants),
  // not a claim that data types ARE the algorithmic idea.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "need",
      label: "Kinds of value",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Whole numbers",
      takeaway: reg({
        base: "Every value has a type; Python infers it from how you write it.",
        intuitive: "Every value is a kind of value — Python reads the kind off how you write it.",
      }),
      visual: <g><Cap>a value isn't just a value — it's a kind of value</Cap>{four(-1)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Kinds of value", title: "Not all values are alike.",
        body: reg({
          base: <>A whole number, a number with a decimal, a piece of text, a yes/no &mdash; these behave differently. Each value carries a <strong>type</strong>, and Python works it out from how you write the value (no need to declare it).</>,
          intuitive: <>Look at the four boxes: a whole number, a number with a decimal point, a piece of text, a yes/no answer. They feel different because they <em>are</em> different &mdash; each value carries a <strong>type</strong>, its kind. And you never announce the kind: Python reads it straight off how you write the value.</>,
        }),
      }],
      detail: reg({
        base: <><p>The type decides what you can do with a value: you can multiply numbers, join text, and test booleans. Mixing them up is one of the most common beginner errors &mdash; knowing the four basic types prevents it.</p></>,
        intuitive: (
          <>
            <p>Why care about kinds? Because the kind decides what a value can <em>do</em>. You can multiply two numbers &mdash; but what would multiplying two pieces of text even mean? You can ask &ldquo;yes or no?&rdquo; of a <Term word="boolean">boolean</Term> &mdash; but not of a price.</p>
            <p>Treating one kind like another &mdash; text like a number, say &mdash; is one of the most common beginner errors there is. Meeting the four basic kinds now is the vaccine.</p>
          </>
        ),
      }),
      codeLabels: ["int"],
    },
    {
      id: "numbers",
      label: "Numbers: int & float",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      connector: "Start with the two number types.",
      actionLabel: "Text",
      takeaway: "int is a whole number; float has a decimal point.",
      visual: <g><Cap>7 is an int (whole) · 3.14 is a float (has a decimal)</Cap>{four(0)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Numbers: int & float", title: "age = 7   ·   price = 3.14",
        body: reg({
          base: <>A whole number like <code>7</code> is an <Term word="integer">int</Term>. A number with a decimal point like <code>3.14</code> is a <Term word="float">float</Term>. The dot is the only difference in how you write them.</>,
          intuitive: <>A whole number like <code>7</code> &mdash; nothing after it &mdash; is an <Term word="integer">int</Term>, short for integer. A number with a decimal point, like <code>3.14</code>, is a <Term word="float">float</Term>. Notice what separates them on the page: just the dot. That tiny spelling difference is the whole signal Python needs.</>,
        }),
      }],
      detail: reg({
        base: <><p>Both are numbers, so <code>+ - * /</code> work on them. Dividing with <code>/</code> always gives a float (<code>10 / 2</code> is <code>5.0</code>), which surprises people &mdash; that trailing <code>.0</code> is Python telling you the type.</p></>,
        intuitive: (
          <>
            <p>Both kinds are numbers, so the usual maths &mdash; <code>+ - * /</code> &mdash; works on either. One surprise worth banking now: dividing with <code>/</code> always hands back a float, even when it lands exactly. <code>10 / 2</code> is <code>5.0</code>, not <code>5</code>.</p>
            <p>That trailing <code>.0</code> isn&rsquo;t decoration &mdash; it&rsquo;s Python showing you the answer&rsquo;s kind right in how it&rsquo;s written: the same spelling signal, read back the other way.</p>
          </>
        ),
      }),
      codeLabels: ["int", "float"],
    },
    {
      id: "text",
      label: "Text: str",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "Text is its own type — and it needs quotes.",
        rigorous: "",
      }),
      actionLabel: reg({
        base: "True or False",
        rigorous: "Name the idea",
      }),
      takeaway: reg({
        base: "Text is a string (str), written inside quotes.",
        intuitive: 'Quotes make text: "7" in quotes is a string, not the number 7.',
        rigorous: 'Literal syntax fixes type — "7" is str, not int, and different operations apply.',
      }),
      visual: (api) => <QuotedDigitsGate api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Text: str", title: 'name = "Ada"',
        body: reg({
          base: <>Text is a <Term word="string">string</Term> (<code>str</code>). The <strong>quotes</strong> matter: <code>&quot;Ada&quot;</code> is the text Ada, while <code>Ada</code> without quotes would be a variable name to look up.</>,
          intuitive: <>A piece of text is a <Term word="string">string</Term> &mdash; type <code>str</code>. The <strong>quotes</strong> do real work: <code>&quot;Ada&quot;</code> means the text Ada, while bare <code>Ada</code> would send Python looking for a variable by that name. So quotes turn what they wrap into text. One case is trickier than it looks &mdash; commit to a guess below before reading on.</>,
          rigorous: <>String literals: quotes delimit text &mdash; <code>&quot;Ada&quot;</code> is a <code>str</code> value, bare <code>Ada</code> is a name lookup. The literal&rsquo;s syntax alone fixes the type, and the type is the invariant: set when the value is written, unchanged for the value&rsquo;s lifetime &mdash; only names get rebound. Commit to the case below first.</>,
        }),
      }],
      detail: reg({
        base: <><p><code>&quot;7&quot;</code> (with quotes) is text, not the number <code>7</code> &mdash; you can&rsquo;t do maths on it until you convert it. That type mismatch is behind a huge share of beginner bugs.</p></>,
        intuitive: (
          <>
            <p>The case you just predicted: <code>&quot;7&quot;</code>, with quotes, is text &mdash; a string that happens to be made of a digit. It is not the number <code>7</code>. Try maths on it and Python refuses: <code>&quot;7&quot; + 1</code> is an error, because gluing a number onto text makes no sense.</p>
            <p>When you really do have digits-as-text (something a user typed, say), convert first: <code>int(&quot;7&quot;)</code> hands you the number <code>7</code>. Mixing the two without converting is behind a huge share of beginner bugs &mdash; you&rsquo;ve now met it once, on purpose.</p>
          </>
        ),
        rigorous: (
          <>
            <p><code>&quot;7&quot;</code> is <code>str</code>, not <code>int</code>: <code>&quot;7&quot; + 1</code> raises <code>TypeError</code>; <code>&quot;7&quot; + &quot;7&quot;</code> concatenates to <code>&quot;77&quot;</code>; <code>int(&quot;7&quot;)</code> converts explicitly. Python is dynamically typed &mdash; names carry no type &mdash; but strongly typed: no implicit coercion between <code>str</code> and <code>int</code>, so mismatches fail loudly at the operation instead of corrupting silently.</p>
          </>
        ),
      }),
      codeLabels: ["str"],
      interaction: "wedge",
    },
    {
      id: "bool",
      label: "Yes / no: bool",
      registers: ["intuitive", "structured"],
      connector: "And the type behind every decision.",
      actionLabel: "See them together",
      takeaway: reg({
        base: "A boolean (bool) is just True or False — what conditions produce.",
        intuitive: "A bool is a yes/no value — True or False — exactly what an if checks.",
      }),
      visual: <g><Cap>{"age >= 18 → False · a bool is the answer to a yes/no question"}</Cap>{four(3)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Yes / no: bool", title: "is_adult = age >= 18",
        body: reg({
          base: <>A <Term word="boolean">boolean</Term> (<code>bool</code>) is either <code>True</code> or <code>False</code>. Comparisons produce them &mdash; <code>age &gt;= 18</code> is <code>False</code> &mdash; and that&rsquo;s exactly what an <code>if</code> checks.</>,
          intuitive: <>The fourth kind answers a yes/no question. A <Term word="boolean">boolean</Term> (<code>bool</code>) has exactly two possible values: <code>True</code> and <code>False</code>. You rarely type them yourself &mdash; comparisons make them. <code>age &gt;= 18</code> asks &ldquo;is age at least 18?&rdquo;; with <code>age</code> holding <code>7</code>, the answer is <code>False</code>.</>,
        }),
      }],
      detail: reg({
        base: <><p>Booleans are the bridge to conditionals: a condition is just an expression whose type is <code>bool</code>. <code>True</code> and <code>False</code> are special words, not text &mdash; no quotes.</p></>,
        intuitive: (
          <>
            <p>Notice: no quotes. <code>True</code> and <code>False</code> are special words Python knows, not text &mdash; after the last beat you can say why <code>&quot;True&quot;</code> in quotes would be something else entirely (a string). The capital letter matters too.</p>
            <p>And this kind is the doorway ahead: a condition is simply an expression whose value is a <code>bool</code>, and an <code>if</code> reads that yes/no to decide which code runs. That&rsquo;s the next power unlocked.</p>
          </>
        ),
      }),
      codeLabels: ["bool"],
    },
    {
      id: "recap",
      label: "Four to start",
      connector: reg({
        base: "Read all four as one row.",
        rigorous: "One rule covers the whole row — name it and file it.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "int · float · str · bool — the type decides what you can do.",
        intuitive: "Four starter types — int, float, str, bool; the kind decides what a value can do.",
        rigorous: "A value's type is fixed and decides its valid operations — the first invariant.",
      }),
      visual: <g><Cap>{"type(price) → <class 'float'> · the same value can be checked any time"}</Cap>{four(-1)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Four to start",
        title: reg({
          base: "int · float · str · bool",
          rigorous: "A type: a value's standing guarantee.",
        }),
        body: reg({
          base: <>Those four cover most early code. The type travels <em>with</em> the value, so <code>3 + 4</code> adds to <code>7</code>, while <code>&quot;3&quot; + &quot;4&quot;</code> joins to <code>&quot;34&quot;</code> &mdash; same symbol, different behaviour by type.</>,
          intuitive: <>Four kinds cover most early code &mdash; and the kind travels <em>with</em> the value wherever it goes. <code>3 + 4</code> adds up to <code>7</code>, while <code>&quot;3&quot; + &quot;4&quot;</code> glues text into <code>&quot;34&quot;</code>. Same <code>+</code>, completely different move &mdash; the value&rsquo;s kind decided which.</>,
          rigorous: <>The model: every value carries exactly one type; names carry none. Operators dispatch on it &mdash; <code>3 + 4</code> &rarr; <code>7</code>, <code>&quot;3&quot; + &quot;4&quot;</code> &rarr; <code>&quot;34&quot;</code>, <code>&quot;3&quot; + 4</code> &rarr; <code>TypeError</code>. <code>type(x)</code> inspects the guarantee at runtime.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You can always ask Python a value&rsquo;s type with <code>type(x)</code>. Later types (lists, and more) build on these same ideas. Next: the <strong>operators</strong> that combine them.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 3 of 7 &mdash; invariants:</strong> a type is a standing guarantee about a value &mdash; a fact that stays true, so nothing downstream has to re-check it.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>These kinds have a proper name: <strong>data types</strong>. You can always ask Python a value&rsquo;s kind with <code>type(x)</code> &mdash; try it on <code>price</code> in the code panel. Later kinds (lists and more) build on these same four. Next: the <strong>operators</strong> that combine them.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The third big idea (3 of 7), planted early &mdash; a promise that holds:</strong> a value&rsquo;s kind is a guarantee that never breaks, so you can lean on it without ever checking twice. Later lessons run whole algorithms on facts like that &mdash; they&rsquo;re called <Term word="invariant">invariants</Term>.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model, complete:</strong> values are typed, names are not; literal syntax fixes the type; operators dispatch on it, and mismatches raise <code>TypeError</code> rather than coerce. <code>int(&quot;7&quot;)</code>, <code>str(7)</code>, <code>float(7)</code> convert explicitly. Edges worth banking: <code>/</code> always yields <code>float</code> (<code>10 / 2</code> is <code>5.0</code>; <code>//</code> floors), and <code>bool</code> is a subclass of <code>int</code> (<code>True == 1</code>), so booleans survive arithmetic contexts.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7, foreshadowed &mdash; <Term word="invariant">invariants</Term>:</strong> a type is a guarantee fixed for the value&rsquo;s lifetime; maintaining a fact that stays true is the same move algorithms later make at full scale.
            </div>
          </>
        ),
      }),
      codeLabels: ["type"],
    },
  ],
};
