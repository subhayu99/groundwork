import { DerivationStep } from "@/shared/derivation/types";

export const setsTuplesSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Two small containers. Two different jobs.",
        body: (
          <>
            <p>
              Tonight we&rsquo;re tracking who&rsquo;s logged into a chat room. You don&rsquo;t care
              when they arrived, you don&rsquo;t care twice if the same person logs in twice. You
              only care: <em>is alice in the room or not?</em>
            </p>
            <p>
              Down the hall someone&rsquo;s logging weather readings. Each one is{" "}
              <em>(date, latitude, temperature)</em>. Those three numbers belong together as one
              packet. You don&rsquo;t insert a fourth value. You don&rsquo;t change the second.
            </p>
            <p>
              Both are containers, but their rules are opposite.
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
        title: "Stuff a list. Scan when you need it.",
        body: (
          <>
            <p>
              You could keep a list of logged-in users. To check if alice is in there, scan the list
              until you find her or run out.
            </p>
            <p>
              You could also keep weather readings in a list and pull values by index 0, 1, 2. But a
              future you might forget which index is the latitude.
            </p>
            <p>
              Both work. Neither is doing what the data wants.
            </p>
          </>
        ),
        actionLabel: "What do these need?",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Try adding the same person twice. Then try the packet.",
        body: (
          <>
            <p>
              On the right is a small set. Try adding <em>alice</em>. Add her again. The set
              doesn&rsquo;t care &mdash; she&rsquo;s in or she isn&rsquo;t. There&rsquo;s no
              ordering, no counting, no &ldquo;second alice.&rdquo;
            </p>
            <p>
              Below it is a tuple. Try to change a field. Try to add a fourth. Both fail. The packet
              is fixed.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what does the data structure&rsquo;s
              <em> rejection</em> tell you about what it&rsquo;s for?
            </div>
          </>
        ),
        actionLabel: "Identity vs grouping",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structures",
        title: "A set is a hash map's keys. A tuple is a fixed record.",
        body: (
          <>
            <p>
              A <strong>set</strong> is a hash map where we threw away the values. We only kept the
              keys. <em>Is x in the table?</em> One hop, constant time. Inserting the same item
              twice changes nothing &mdash; the bucket already has it.
            </p>
            <p>
              A <strong>tuple</strong> is the opposite kind of container. It&rsquo;s an
              <em> ordered, fixed-size, immutable</em> sequence. You can&rsquo;t change a field, can&rsquo;t
              add a fourth element. The fields are positional &mdash; the first one is always the
              date, the second is always the latitude.
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
        title: "Sets are hash-fast. Tuples are basically free.",
        body: (
          <>
            <p>
              <strong>Set:</strong> add, remove, <code>in</code> are all <code>O(1)</code> average.
              Union, intersection, difference are <code>O(min(|A|, |B|))</code> on average. No
              ordering, no <code>set[i]</code>.
            </p>
            <p>
              <strong>Tuple:</strong> access by index is <code>O(1)</code>. Iteration is{" "}
              <code>O(n)</code>. There&rsquo;s no mutation API at all. Crucially, because
              they&rsquo;re immutable, tuples can be used as <strong>keys in hash maps</strong> or{" "}
              <strong>elements of sets</strong>. Lists cannot.
            </p>
          </>
        ),
        actionLabel: "When each fits",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When they fit",
        title: "Set for 'is X here?'. Tuple for 'X, Y, Z stay together.'",
        body: (
          <>
            <p>
              Reach for a <strong>set</strong> when you&rsquo;d say &ldquo;contains?&rdquo;,
              &ldquo;unique?&rdquo;, &ldquo;in both?&rdquo;, or &ldquo;in one but not the
              other?&rdquo;. Online users. Seen URLs. Visited nodes. Whitelists.
            </p>
            <p>
              Reach for a <strong>tuple</strong> when several values describe one thing and the
              shape is fixed: <em>(x, y)</em> coordinates, <em>(row, col)</em> grid positions,{" "}
              <em>(date, latitude, temperature)</em> readings, function returns with multiple
              fields.
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
        title: "Set and Tuple.",
        body: (
          <>
            <p>
              Python uses curly braces for sets &mdash; <code>{"{1, 2, 3}"}</code> &mdash; and
              parentheses for tuples &mdash; <code>(1, 2, 3)</code>. They look small but they pull
              their weight.
            </p>
            <p>
              The deeper move both structures make: <em>express what the data is for</em>. A list is
              flexible to the point of being silent about intent. A set says &ldquo;membership
              matters.&rdquo; A tuple says &ldquo;these values are one thing.&rdquo;
            </p>
            <p>
              Open the drawer for the Python interface.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
