import { DerivationStep } from "@/shared/derivation/types";

export const slidingWindowVariableSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "The longest stretch of letters with no repeats.",
        body: (
          <>
            <p>
              You&rsquo;re looking at a row of letters. Your friend asks: &ldquo;What&rsquo;s the
              longest stretch you can read in a row without saying the same letter twice?&rdquo;
            </p>
            <p>
              The fixed sliding window asked &ldquo;always exactly <em>k</em>.&rdquo; This one
              doesn&rsquo;t care about size &mdash; it cares about a <em>property</em>: every
              letter in the stretch is unique.
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
        title: "Check every possible stretch.",
        body: (
          <>
            <p>
              The naive approach: for every starting position, scan rightward until you hit a
              repeat. Track the longest valid stretch you found. For an <em>n</em>-letter string
              that&rsquo;s about <code>n²/2</code> character checks.
            </p>
            <p>
              And we keep re-checking the same letters. If we know <em>abc</em> is fine starting at
              position 0, we&rsquo;ll re-verify it starting at position 1 (now checking <em>bc</em>),
              then again at position 2 (now <em>c</em>). The information is right there;
              we&rsquo;re just throwing it away.
            </p>
          </>
        ),
        actionLabel: "Reuse what's already valid",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Two ends. Move them independently.",
        body: (
          <>
            <p>
              On the right is a small string. Two markers: <code>L</code> on the left edge of your
              current stretch, <code>R</code> on the right edge. Press <em>expand</em> to add the
              next letter to the window. Press <em>contract</em> to drop the leftmost letter.
            </p>
            <p>
              Find the longest valid (no-repeat) stretch by playing with the two buttons. Notice:
              you never have to start over. You only ever grow the right or shrink the left.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> when does <code>R</code> want to move? When does{" "}
              <code>L</code> have to move? Are they ever moving for the same reason?
            </div>
          </>
        ),
        actionLabel: "Two motions, one rule",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Right grows greedily. Left shrinks just enough.",
        body: (
          <>
            <p>
              Walk <code>R</code> across the string. Each step, check whether <code>s[R]</code>{" "}
              already appears inside the current window <code>[L, R)</code>.
            </p>
            <p>
              <strong>Not a repeat?</strong> Extend the window. Update the running best length if
              this stretch is the longest you&rsquo;ve seen.
            </p>
            <p>
              <strong>Already in?</strong> The window has broken its 'no repeats' rule. Move <code>L</code>{" "}
              forward until the duplicate is just out of bounds. With a hash map of{" "}
              <em>character → last seen index</em>, we can jump <code>L</code> straight there in{" "}
              <code>O(1)</code>.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> the window keeps a rule alive &mdash; &ldquo;every
              letter inside is unique.&rdquo; <code>R</code> grows the window as long as the rule
              still holds. <code>L</code> shrinks it the smallest amount needed to bring the rule
              back.
            </div>
          </>
        ),
        actionLabel: "Count the work",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The win",
        title: "Every letter touched twice. Linear time.",
        body: (
          <>
            <p>
              Each letter enters the window at most once (when <code>R</code> passes it) and exits
              at most once (when <code>L</code> passes it). That&rsquo;s <code>2n</code>{" "}
              operations total &mdash; <code>O(n)</code> (cost grows in step with how long the string is).
            </p>
            <p>
              Naive on a thousand-letter string is half a million checks. This is two thousand.
            </p>
            <p>
              The hash map adds <code>O(1)</code> per step (instant &mdash; same cost no matter how big the map gets). Memory is at most one entry per distinct
              character &mdash; for English text that&rsquo;s ~26.
            </p>
          </>
        ),
        actionLabel: "Same shape, new problems",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Any yes/no rule that holds for small windows and breaks past a point.",
        body: (
          <>
            <p>
              The trick works whenever the window has a <em>rule that breaks cleanly the moment you cross a line</em>:
            </p>
            <p>
              &ldquo;Smallest window containing every character of <code>pattern</code>&rdquo; &mdash;
              right grows until the window covers the pattern, then left shrinks while it still
              covers.
            </p>
            <p>
              &ldquo;Longest subarray with at most <code>k</code> distinct values&rdquo; &mdash;
              same template; the rule is &ldquo;at most k different items in the window.&rdquo;
            </p>
            <p>
              &ldquo;Maximum sum subarray with non-negative values and length at most <code>k</code>&rdquo;
              &mdash; same. The condition changes; the dance is the same.
            </p>
          </>
        ),
        actionLabel: "Name it",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The pattern",
        title: "Sliding Window (Variable).",
        body: (
          <>
            <p>
              That&rsquo;s the name. Same family as the fixed-size sliding window, but the window
              breathes. Right expands when it can; left contracts when it must.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Longest / shortest substring (or subarray) such that ...&rdquo;</li>
              <li>&ldquo;At most k of X&rdquo; / &ldquo;at least k of X&rdquo;</li>
              <li>&ldquo;Smallest window containing all of Y&rdquo;</li>
              <li>Any &ldquo;works / doesn't work&rdquo; rule that flips once on a contiguous range</li>
            </ul>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
