import { DerivationStep } from "@/shared/derivation/types";

export const slidingWindowSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Someone keeps asking the same kind of question.",
        body: (
          <>
            <p>
              You&rsquo;ve got a row of ten numbers. A friend points at the first three and asks,
              <em> &ldquo;what do those add up to?&rdquo;</em> You add them. Easy.
            </p>
            <p>
              Then they shift their finger one to the right and ask again. And again. And again &mdash;
              eight times in total, until they reach the end.
            </p>
            <p>
              <strong>The question isn&rsquo;t which numbers.</strong> The question is: what&rsquo;s the
              least amount of arithmetic you can possibly get away with?
            </p>
          </>
        ),
        actionLabel: "I see the setup",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Add three numbers. Slide. Add three numbers. Slide.",
        body: (
          <>
            <p>
              The first answer that arrives: just <em>do it</em>. For every position of the window, add
              up the three numbers underneath it.
            </p>
            <p>
              That&rsquo;s <code>3 &times; 8 = 24</code> additions to answer eight questions. Reasonable
              &mdash; until you watch it happen.
            </p>
            <p>
              Look at the second window and the first. They share <strong>two of three</strong> numbers.
              You add those numbers, then a moment later you add them again. And then again.
            </p>
          </>
        ),
        actionLabel: "Something feels wasteful",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Drag the window. Watch only what changes.",
        body: (
          <>
            <p>
              Grab the bracket around the first three cells on the right and drag it one step to the
              right. Then another. Then another.
            </p>
            <p>
              Don&rsquo;t do any math in your head. Just <em>watch the cells</em>. Which ones are inside
              the window before you move? Which ones after?
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> when you slide the window by one, how many numbers
              change? How many stay exactly where they were?
            </div>
          </>
        ),
        actionLabel: "I think I see it",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Turn the picture into a sentence. Then into math.",
        body: (
          <>
            <p>
              Two cells change roles per slide. Three roles total: <em>leaves</em>, <em>stays</em>,
              <em> enters</em>. Let&rsquo;s name them and write down what we just discovered.
            </p>
            <p>
              Call the sum of the window starting at position <code>i</code> simply <code>sum[i]</code>.
              When the window slides from <code>i</code> to <code>i+1</code>, the only cells that move
              are <em>arr[i]</em> (leaver) and <em>arr[i+k]</em> (newcomer).
            </p>
            <p>
              So the recurrence almost writes itself:
              <code> sum[i+1] = sum[i] &minus; arr[i] + arr[i+k]</code>. Two operations. The middle
              <code> k &minus; 1</code> numbers never enter the equation again.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> we paid for information once and reused it forever after.
              That&rsquo;s the whole deal &mdash; <em>information reuse</em>.
            </div>
          </>
        ),
        actionLabel: "Count the operations",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The win",
        title: "Count operations both ways. Then keep counting.",
        body: (
          <>
            <p>
              Watch the naive counter pile up <code>k</code> additions per slide; the derived counter only
              adds 2. With <code>k=3</code> it&rsquo;s a small lead. With <code>k=100</code> on a million
              numbers, naive takes <em>fifty times</em> longer.
            </p>
            <p>
              Use the toggle to see what the same array would have cost without the wedge. The shape of
              the work is the same &mdash; only the bookkeeping is different.
            </p>
          </>
        ),
        actionLabel: "Try it on a different question",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Same wedge. New question. What carries over?",
        body: (
          <>
            <p>
              Forget the every-three-in-a-row question. Now I want <strong>the biggest</strong>{" "}
              three-in-a-row sum on the same array. One number, not eight.
            </p>
            <p>
              Same wedge applies: slide a window of three, but this time keep the maximum sum you&rsquo;ve
              seen along the way. Two operations per slide, plus one comparison.
            </p>
            <p>
              The pattern doesn&rsquo;t care about your question. It cares that you&rsquo;re looking at
              contiguous windows whose value changes incrementally.
            </p>
          </>
        ),
        actionLabel: "Name the pattern",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The pattern",
        title: "Sliding Window.",
        body: (
          <>
            <p>
              That&rsquo;s the name. You earned it. It applies whenever you&rsquo;re looking at contiguous
              subsequences and the computation can be maintained incrementally as the window moves.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Contiguous subarray of length k&rdquo;</li>
              <li>&ldquo;Longest / shortest window satisfying X&rdquo;</li>
              <li>&ldquo;Number of substrings with property Y&rdquo;</li>
            </ul>
            <p>
              The code drawer below has the Python. The next-steps section has problems to try.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
