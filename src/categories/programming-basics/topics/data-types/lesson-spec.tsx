import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
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

export const dataTypesLesson: LessonSpec = {
  topicTitle: "data types · kinds of value",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: dataTypesPy as string,
  beats: [
    {
      id: "need",
      label: "Kinds of value",
      actionLabel: "Whole numbers",
      takeaway: "Every value has a type; Python infers it from how you write it.",
      visual: <g><Cap>a value isn't just a value — it's a kind of value</Cap>{four(-1)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Kinds of value", title: "Not all values are alike.",
        body: <>A whole number, a number with a decimal, a piece of text, a yes/no &mdash; these behave differently. Each value carries a <strong>type</strong>, and Python works it out from how you write the value (no need to declare it).</>,
      }],
      detail: <><p>The type decides what you can do with a value: you can multiply numbers, join text, and test booleans. Mixing them up is one of the most common beginner errors &mdash; knowing the four basic types prevents it.</p></>,
      codeLabels: ["int"],
    },
    {
      id: "numbers",
      label: "Numbers: int & float",
      connector: "Start with the two number types.",
      actionLabel: "Text",
      takeaway: "int is a whole number; float has a decimal point.",
      visual: <g><Cap>7 is an int (whole) · 3.14 is a float (has a decimal)</Cap>{four(0)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Numbers: int & float", title: "age = 7   ·   price = 3.14",
        body: <>A whole number like <code>7</code> is an <Term word="integer">int</Term>. A number with a decimal point like <code>3.14</code> is a <Term word="float">float</Term>. The dot is the only difference in how you write them.</>,
      }],
      detail: <><p>Both are numbers, so <code>+ - * /</code> work on them. Dividing with <code>/</code> always gives a float (<code>10 / 2</code> is <code>5.0</code>), which surprises people &mdash; that trailing <code>.0</code> is Python telling you the type.</p></>,
      codeLabels: ["int", "float"],
    },
    {
      id: "text",
      label: "Text: str",
      connector: "Text is its own type — and it needs quotes.",
      actionLabel: "True or False",
      takeaway: "Text is a string (str), written inside quotes.",
      visual: <g><Cap>"Ada" is a str — the quotes are how Python knows it's text</Cap>{four(2)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Text: str", title: 'name = "Ada"',
        body: <>Text is a <Term word="string">string</Term> (<code>str</code>). The <strong>quotes</strong> matter: <code>&quot;Ada&quot;</code> is the text Ada, while <code>Ada</code> without quotes would be a variable name to look up.</>,
      }],
      detail: <><p><code>&quot;7&quot;</code> (with quotes) is text, not the number <code>7</code> &mdash; you can&rsquo;t do maths on it until you convert it. That type mismatch is behind a huge share of beginner bugs.</p></>,
      codeLabels: ["str"],
    },
    {
      id: "bool",
      label: "Yes / no: bool",
      connector: "And the type behind every decision.",
      actionLabel: "See them together",
      takeaway: "A boolean (bool) is just True or False — what conditions produce.",
      visual: <g><Cap>{"age >= 18 → False · a bool is the answer to a yes/no question"}</Cap>{four(3)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Yes / no: bool", title: "is_adult = age >= 18",
        body: <>A <Term word="boolean">boolean</Term> (<code>bool</code>) is either <code>True</code> or <code>False</code>. Comparisons produce them &mdash; <code>age &gt;= 18</code> is <code>False</code> &mdash; and that&rsquo;s exactly what an <code>if</code> checks.</>,
      }],
      detail: <><p>Booleans are the bridge to conditionals: a condition is just an expression whose type is <code>bool</code>. <code>True</code> and <code>False</code> are special words, not text &mdash; no quotes.</p></>,
      codeLabels: ["bool"],
    },
    {
      id: "recap",
      label: "Four to start",
      connector: "Read all four as one row.",
      actionLabel: "Done",
      takeaway: "int · float · str · bool — the type decides what you can do.",
      visual: <g><Cap>{"type(price) → <class 'float'> · the same value can be checked any time"}</Cap>{four(-1)}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Four to start", title: "int · float · str · bool",
        body: <>Those four cover most early code. The type travels <em>with</em> the value, so <code>3 + 4</code> adds to <code>7</code>, while <code>&quot;3&quot; + &quot;4&quot;</code> joins to <code>&quot;34&quot;</code> &mdash; same symbol, different behaviour by type.</>,
      }],
      detail: <><p>You can always ask Python a value&rsquo;s type with <code>type(x)</code>. Later types (lists, and more) build on these same ideas. Next: the <strong>operators</strong> that combine them.</p></>,
      codeLabels: ["type"],
    },
  ],
};
