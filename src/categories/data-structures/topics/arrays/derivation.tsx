import { DerivationStep } from "@/shared/derivation/types";

export const arraysSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "A thousand books. Find the 487th.",
        body: (
          <>
            <p>
              You&rsquo;re organizing a thousand books. Your friend asks: &ldquo;Hand me book number
              four-eighty-seven.&rdquo;
            </p>
            <p>
              You don&rsquo;t care which book it is. You don&rsquo;t care about its title. You just need
              the one that&rsquo;s in <em>position 487</em>. How fast can you get to it?
            </p>
          </>
        ),
        actionLabel: "I have the question",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Pile of books. Count from the top.",
        body: (
          <>
            <p>
              The simplest way: stack the books in a pile. To get book 487, lift the top one (1), the
              next (2), the next (3)... all the way to 487. That&rsquo;s 487 lifts to answer one
              question.
            </p>
            <p>
              And every time the question changes &mdash; book 53? book 921? &mdash; you start from
              the top again. The cost grows with the position you&rsquo;re asked about.
            </p>
            <p>
              The problem isn&rsquo;t the books. It&rsquo;s the pile.
            </p>
          </>
        ),
        actionLabel: "What changes if we rearrange?",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Give every position a fixed home.",
        body: (
          <>
            <p>
              Now imagine the books in a long shelf. Each slot is the same size. Slot 0, slot 1, slot
              2... slot 999. You don&rsquo;t need to lift book 487 by counting &mdash; you walk
              straight to slot 487.
            </p>
            <p>
              Move the slider on the right and watch what happens. Hover the cells too.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what changed about the books? Nothing. What
              changed about the <em>arrangement</em>?
            </div>
          </>
        ),
        actionLabel: "Storage decides speed",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "Same-size slots. Contiguous in memory.",
        body: (
          <>
            <p>
              That row of slots is an <strong>array</strong>. Every element is the same size, and
              they&rsquo;re laid out next to each other in memory. The address of slot{" "}
              <code>i</code> is just <code>base + i &times; size</code>.
            </p>
            <p>
              That arithmetic is one CPU instruction. <em>Constant time</em>, regardless of how big
              the array is. A thousand books, a million books &mdash; same cost to reach slot 487.
            </p>
          </>
        ),
        actionLabel: "What operations cost what?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "What's cheap, what's not, and why.",
        body: (
          <>
            <p>
              <strong>Read or write by index:</strong> <code>O(1)</code> (instant &mdash; same cost no matter how big the list is). The address math.
            </p>
            <p>
              <strong>Append at the end:</strong> <code>O(1)</code> on average (dynamic arrays
              occasionally reallocate). You stay right next to the last element.
            </p>
            <p>
              <strong>Insert in the middle:</strong> <code>O(n)</code> (cost grows in step with the size of the list). Every element after the
              insertion point has to shift right by one slot to make room.
            </p>
            <p>
              <strong>Find a value (no index given):</strong> <code>O(n)</code>. You have to look at
              elements until you find it.
            </p>
          </>
        ),
        actionLabel: "When does this fit?",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When it fits",
        title: "Use arrays when position matters more than middle-edits.",
        body: (
          <>
            <p>
              Arrays are the default for almost any sequence. Reach for them whenever the workload
              looks like: <em>read by position, append, scan from start to end</em>.
            </p>
            <p>
              Reach for something else when the workload is dominated by <em>inserting and deleting
              from the middle</em> &mdash; you&rsquo;ll pay <code>O(n)</code> per edit. Linked lists,
              trees, or hash maps fit those workloads better.
            </p>
          </>
        ),
        actionLabel: "Name the structure",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The structure",
        title: "Array. List, in Python.",
        body: (
          <>
            <p>
              That&rsquo;s the name. In low-level languages, an array has a fixed size. In Python,{" "}
              <code>list</code> is a <strong>dynamic array</strong> &mdash; it grows when you append.
              The cost model is the same.
            </p>
            <p>
              When you see <code>arr[i]</code> in code, the runtime is doing that{" "}
              <code>base + i &times; size</code> jump. That single line is the whole reason arrays
              are everywhere.
            </p>
            <p>
              Open the drawer below to see the operations you&rsquo;ll use day-to-day.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
