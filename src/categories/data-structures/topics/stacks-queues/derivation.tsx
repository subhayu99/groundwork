import { DerivationStep } from "@/shared/derivation/types";

export const stacksQueuesSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Two questions. Different rules. Same row of items.",
        body: (
          <>
            <p>
              You&rsquo;re reading. Your browser tracks where you&rsquo;ve been so you can hit{" "}
              <em>back</em>. The newest page should come back first.
            </p>
            <p>
              In a different room, a barista is making drinks. Whoever ordered <em>first</em> gets
              served first. New orders go to the end.
            </p>
            <p>
              Both are just lists of items. So why do the rules look opposite?
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
        title: "Use an array. Add to the end. Remove from anywhere.",
        body: (
          <>
            <p>
              We already know how arrays cost. Adding at the end is instant — one move, no matter how long the list is. Removing from the end, same thing. Beautiful.
            </p>
            <p>
              But for the barista, the next customer is at the <em>front</em>. Removing the front of
              an array means every other order shifts left by one — the cost grows with how many orders are waiting. After a
              busy morning that&rsquo;s a lot of shifting.
            </p>
            <p>
              Same array. Two different access patterns. Two different costs.
            </p>
          </>
        ),
        actionLabel: "What's the trick?",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Push and pop. Watch which end they touch.",
        body: (
          <>
            <p>
              On the right are two structures. Both start empty. Press <em>push</em> a few times and
              then <em>pop</em>. Watch carefully &mdash; the stack adds and removes at the same end.
              The queue adds at one end and removes from the other.
            </p>
            <p>
              The structure isn&rsquo;t different. The promise about <em>where you touch</em> is.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> if you decide in advance that the only places
              you&rsquo;ll touch are the ends, what becomes free?
            </div>
          </>
        ),
        actionLabel: "Restrict, then optimize",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "Stack: one end. Queue: two ends, different roles.",
        body: (
          <>
            <p>
              A <strong>stack</strong> only lets you add and remove at the <em>top</em>. Newest item
              comes out first. <em>LIFO &mdash; last in, first out.</em>
            </p>
            <p>
              A <strong>queue</strong> lets you add at one end (the <em>back</em>) and remove from
              the other (the <em>front</em>). Oldest item comes out first.{" "}
              <em>FIFO &mdash; first in, first out.</em>
            </p>
            <p>
              That&rsquo;s the entire idea. The restriction isn&rsquo;t a limitation &mdash;
              it&rsquo;s how we make both operations instant.
            </p>
          </>
        ),
        actionLabel: "What's the cost?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "All ends. All constant time. No middle.",
        body: (
          <>
            <p>
              <strong>Stack:</strong> <code>push</code> and <code>pop</code> are both{" "}
              <code>O(1)</code> (instant &mdash; same cost no matter how tall the stack gets). <code>peek</code> (look at the top without removing) is{" "}
              <code>O(1)</code>. There&rsquo;s no &ldquo;random access&rdquo; in a stack &mdash; if
              you need to look inside, it&rsquo;s the wrong structure.
            </p>
            <p>
              <strong>Queue:</strong> <code>enqueue</code> at the back and <code>dequeue</code> from
              the front are both <code>O(1)</code>. Python&rsquo;s <code>collections.deque</code> is
              the right tool &mdash; a plain list&rsquo;s <code>pop(0)</code> looks innocent but is{" "}
              <code>O(n)</code> (cost grows in step with how many items are in the queue).
            </p>
          </>
        ),
        actionLabel: "When does each fit?",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When it fits",
        title: "Stack for undo / recursion. Queue for fairness / work pools.",
        body: (
          <>
            <p>
              Reach for a <strong>stack</strong> when the next thing you need is the most recently
              added: <em>browser back button, function call stack, undo history, balanced
              parentheses, depth-first traversal</em>.
            </p>
            <p>
              Reach for a <strong>queue</strong> when the next thing you need is the oldest waiting:{" "}
              <em>scheduling, breadth-first traversal, task queues, print spoolers, request
              pipelines</em>.
            </p>
            <p>
              If you&rsquo;re ever tempted to remove from the middle, you want a different structure
              entirely.
            </p>
          </>
        ),
        actionLabel: "Name them",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The structures",
        title: "Stack and Queue.",
        body: (
          <>
            <p>
              The names come from the physical analogy. A stack of plates: you take from the top, you
              add to the top. A queue at a coffee shop: new customers join the back, the barista
              calls the front.
            </p>
            <p>
              They&rsquo;re not separate data structures so much as two contracts on top of an
              array. The contract is what makes the operations fast.
            </p>
            <p>
              Open the drawer to see how Python expresses both.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
