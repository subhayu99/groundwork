import type { LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { Box, Cap, VW } from "../../_shared";
import forPy from "./algorithm.py";

const ITEMS = [10, 20, 30];
const IW = 96, IGAP = 26, IY = 240;
const totalW = ITEMS.length * IW + (ITEMS.length - 1) * IGAP;
const IX0 = 150;

/** the collection as a row of boxes, with the current item highlighted */
function Items({ current }: { current: number }) {
  return (
    <g>
      <text x={IX0 + totalW / 2} y={IY - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>[ 10, 20, 30 ]</text>
      {ITEMS.map((v, i) => {
        const x = IX0 + i * (IW + IGAP), on = i === current, past = current >= 0 && i < current;
        return (
          <g key={i} opacity={past ? 0.55 : 1} style={{ transition: "opacity .3s" }}>
            <rect x={x} y={IY} width={IW} height={56} rx={10} fill={on ? "var(--accent-soft)" : "var(--bg-card)"} stroke={on ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={x + IW / 2} y={IY + 28} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 18, fill: "var(--text)" }}>{v}</text>
            {on && <text x={x + IW / 2} y={IY + 74} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>price</text>}
          </g>
        );
      })}
    </g>
  );
}

const ACC_X = IX0 + totalW + 70;

export const forLoopsLesson: LessonSpec = {
  topicTitle: "for loops · once per item",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: forPy as string,
  beats: [
    {
      id: "need",
      label: "Walk a collection",
      actionLabel: "Set up the walk",
      takeaway: "A for loop runs its block once for each item — no counter to manage.",
      visual: (
        <g>
          <Cap>you have a list of things; do the same step to each one</Cap>
          <Items current={-1} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="0" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Walk a collection", title: "Do something to every item.",
        body: <>Often you have a <em>collection</em> &mdash; prices, names, rows &mdash; and want the same step for each. A <code>while</code> with a counter works, but it&rsquo;s fiddly (start, condition, increment, off-by-one). The <code>for</code> loop is built exactly for this.</>,
      }],
      detail: <><p>Read it almost like English: <code>for price in [10, 20, 30]:</code> means &ldquo;for each <code>price</code> in this list, do the block.&rdquo; No counter, no condition to get wrong.</p></>,
      codeLabels: ["init", "for"],
    },
    {
      id: "first",
      label: "First item",
      connector: "The loop hands you one item at a time.",
      actionLabel: "Next item",
      takeaway: "Each round, the loop variable becomes the next item automatically.",
      visual: (
        <g>
          <Cap>round 1: price = 10 → total = 0 + 10 = 10</Cap>
          <Items current={0} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="10" active tone="good" />
          <line x1={IX0 + IW} y1={IY + 28} x2={ACC_X} y2={IY + 28} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" opacity={0.5} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "First item", title: "price = 10  →  total = 10",
        body: <>On the first round the loop sets <code>price</code> to the first item, <code>10</code>. The body runs: <code>total = total + price</code>, so <code>total</code> goes from <code>0</code> to <code>10</code>.</>,
      }],
      detail: <><p>You never wrote <code>price = 10</code> yourself &mdash; the <code>for</code> loop assigned it for you. That&rsquo;s the convenience: the loop variable is handed the next item each round.</p></>,
      codeLabels: ["for", "body"],
    },
    {
      id: "iterate",
      label: "Each one in turn",
      connector: "It keeps going down the list.",
      actionLabel: "After the last",
      takeaway: "It steps through every item, in order, until the collection runs out.",
      visual: (
        <g>
          <Cap>round 2: price = 20 → total = 10 + 20 = 30</Cap>
          <Items current={1} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="30" active tone="good" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Each one in turn", title: "price = 20  →  total = 30",
        body: <>Round 2: <code>price</code> is now <code>20</code>, and <code>total</code> becomes <code>30</code>. The loop simply walks to the next item and runs the same body &mdash; it knows when to stop on its own.</>,
      }],
      detail: <><p>This is the key difference from <code>while</code>: there&rsquo;s no condition <em>you</em> manage and no risk of an infinite loop. The collection&rsquo;s length decides how many rounds happen.</p></>,
      codeLabels: ["for", "body"],
    },
    {
      id: "done",
      label: "Out the other side",
      connector: "When the items are used up, the loop is done.",
      actionLabel: "Done",
      takeaway: "for = 'for each item'; the collection's length sets the rounds.",
      visual: (
        <g>
          <Cap>✓ used every item · total = 10 + 20 + 30 = 60</Cap>
          <Items current={-1} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="60" active tone="good" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Out the other side", title: "total = 60",
        body: <>After the third item there&rsquo;s nothing left, so the loop ends and <code>total</code> is <code>60</code>. The pattern &mdash; start an accumulator, add each item &mdash; is how you sum, count, or build things from a collection.</>,
      }],
      detail: <><p>Use <code>for</code> whenever you have a known set to walk; use <code>while</code> when you&rsquo;re waiting for a condition with no fixed count. Together they cover all repetition &mdash; and you&rsquo;ll see <code>for</code> on every array and list from here on.</p></>,
      codeLabels: ["body", "after"],
    },
  ],
};
