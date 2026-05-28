import { DerivationStep } from "@/shared/derivation/types";

export const hashMapsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "A phone book with ten thousand names. Find Alice's number.",
        body: (
          <>
            <p>
              You&rsquo;ve got a phone book. Ten thousand names and numbers. Someone walks up and
              asks, &ldquo;What&rsquo;s Alice&rsquo;s number?&rdquo;
            </p>
            <p>
              You don&rsquo;t know which page she&rsquo;s on. You don&rsquo;t even know if she&rsquo;s
              in there. What&rsquo;s the cost of answering?
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
        title: "Open page one. Start reading.",
        body: (
          <>
            <p>
              The simplest approach: read every name from the top until you hit <em>Alice</em>. If
              she&rsquo;s on page 4,872, you read 4,872 entries. If she isn&rsquo;t in the book at
              all, you read 10,000.
            </p>
            <p>
              Sort the book and you can do better with binary search &mdash; <code>log₂(10,000) ≈
              14</code> comparisons. Still not free, and it requires keeping the book sorted on
              every insert.
            </p>
            <p>
              What if there were no searching at all? What if the name <em>told you</em> the page?
            </p>
          </>
        ),
        actionLabel: "Compute, don't search",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Type a name. Watch the address appear.",
        body: (
          <>
            <p>
              On the right is a small phone book and a function that takes a name and produces a
              number &mdash; the slot where that name lives. Try a few names.
            </p>
            <p>
              The function doesn&rsquo;t look up anything. It computes the slot directly from the
              characters of the name. The lookup becomes a single hop, regardless of how many names
              are in the book.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what if every key knew where to find itself?
            </div>
          </>
        ),
        actionLabel: "Compute the address",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "An array of buckets, addressed by a hash function.",
        body: (
          <>
            <p>
              A <strong>hash map</strong> is two pieces glued together:
            </p>
            <p>
              One: an array of slots called <em>buckets</em>. Just a normal array &mdash; we already
              know its <code>arr[i]</code> is <code>O(1)</code>.
            </p>
            <p>
              Two: a <em>hash function</em>. It chews on the key &mdash; a string, an integer,
              anything &mdash; and produces a slot index. <em>Good hash functions spread keys
              uniformly</em>, so no slot gets crowded.
            </p>
            <p>
              To store a value, hash the key, drop it in the bucket. To find it, hash the key, look
              in the bucket. No searching anywhere &mdash; just arithmetic.
            </p>
          </>
        ),
        actionLabel: "What's the actual cost?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Constant time, on average. Watch the word average.",
        body: (
          <>
            <p>
              <strong>Insert, lookup, delete:</strong> <code>O(1)</code> average &mdash; the cost stays the same whether the table holds ten keys or ten million.
            </p>
            <p>
              Two real-world wrinkles to know about:
            </p>
            <p>
              <strong>Collisions:</strong> two different keys can hash to the same bucket. We handle
              that by chaining (a small list per bucket) or open addressing (try the next bucket
              over). When the table isn&rsquo;t too full, this barely matters.
            </p>
            <p>
              <strong>Resize:</strong> when the table fills up, we allocate a bigger one and rehash
              everything. That step is <code>O(n)</code>, but it happens rarely enough that the average cost per insert is still tiny &mdash; constant time. The one slow step is rare enough to disappear in the average.
            </p>
          </>
        ),
        actionLabel: "When it fits",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When it fits",
        title: "Lookups by key. Counting. Caching. Deduping. Most things.",
        body: (
          <>
            <p>
              Reach for a hash map whenever you&rsquo;d say &ldquo;given X, find Y.&rdquo;
            </p>
            <p>
              Counting how many times each word appears in a document. Caching the result of an
              expensive function call. Deduplicating a stream. Joining two datasets on a shared
              field. Looking up a config value by name.
            </p>
            <p>
              The one thing hash maps cannot do is preserve order in a meaningful way, or answer
              range queries (&ldquo;all keys between A and M&rdquo;). For those, you want a tree.
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
        title: "Hash map. Dictionary, in Python.",
        body: (
          <>
            <p>
              Different languages call it different things: <em>hash map</em>, <em>hash table</em>,{" "}
              <em>dictionary</em>, <em>associative array</em>. Same idea everywhere.
            </p>
            <p>
              Python&rsquo;s <code>dict</code> is a hash map. So is JavaScript&rsquo;s plain object
              (sort of) and its <code>Map</code> (properly). Java has <code>HashMap</code>. Go has{" "}
              <code>map</code>. They&rsquo;re the workhorse data structure of the working world.
            </p>
            <p>
              The principle is the deepest one in computer science: <em>trade space for time</em>.
              Allocate a big array so you never have to search.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
