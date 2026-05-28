import { DerivationStep } from "@/shared/derivation/types";

export const stringsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Find a word inside a sentence.",
        body: (
          <>
            <p>
              Someone hands you a sentence and asks: &ldquo;Is the word{" "}
              <code>brown</code> in here? If so, where?&rdquo;
            </p>
            <p>
              You don&rsquo;t see five characters &mdash; you see a stream. So how do you actually
              find <code>brown</code>?
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
        title: "Walk character by character.",
        body: (
          <>
            <p>
              Start at position 0. Compare the next five characters to <code>brown</code>. No match?
              Slide one to the right. Try again. Keep going.
            </p>
            <p>
              For a 19-character sentence and a 5-character pattern, you check 15 starting positions.
              Each one compares up to 5 characters. Worst case: <code>15 &times; 5 = 75</code>{" "}
              comparisons.
            </p>
            <p>
              That works. But notice: text is doing the same thing as the row of array slots. You can
              jump to position 10 in one step. Indexing isn&rsquo;t the bottleneck.
            </p>
          </>
        ),
        actionLabel: "Strings are arrays?",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Drag the highlight. Read what's underneath.",
        body: (
          <>
            <p>
              Use the slider on the right to pick a starting position. The five characters under the
              highlight are the candidate match. Move it across the sentence.
            </p>
            <p>
              While you&rsquo;re moving, notice: jumping to position 12 is no harder than jumping to
              position 2. Reading a single character is one address lookup, just like with arrays.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what&rsquo;s the difference between a string and
              an array of characters? Anything?
            </div>
          </>
        ),
        actionLabel: "Same machinery, different content",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "A string is an array of characters.",
        body: (
          <>
            <p>
              That&rsquo;s the whole story. Indexed by position, contiguous in memory, every operation
              you already learned for arrays applies.
            </p>
            <p>
              The one twist worth knowing: in many languages (Python, Java, JavaScript), strings are{" "}
              <strong>immutable</strong>. <code>s[0] = &apos;T&apos;</code> isn&rsquo;t a thing. To
              change a string you build a new one. That has cost implications when you concatenate a
              lot.
            </p>
          </>
        ),
        actionLabel: "What's cheap, what's not?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Indexing is free. Building is not.",
        body: (
          <>
            <p>
              <strong>Read character at i:</strong> <code>O(1)</code>.
            </p>
            <p>
              <strong>Slice <code>s[i:j]</code>:</strong> <code>O(j &minus; i)</code> &mdash; a new
              string of that length is allocated and the characters are copied.
            </p>
            <p>
              <strong>Concatenate two strings:</strong> <code>O(n + m)</code>. New string, both
              halves copied.
            </p>
            <p>
              <strong>The gotcha:</strong> building a string by repeated <code>+=</code> inside a
              loop is <code>O(n²)</code>, because each step copies the entire prefix. Use a list and{" "}
              <code>&quot;&quot;.join(...)</code> instead.
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
        title: "Text, tokens, addresses, URLs — anything sequential and named.",
        body: (
          <>
            <p>
              Strings are everywhere because most data the world hands you is text: log lines, JSON
              keys, emails, URLs, identifiers, error messages. Anywhere you&rsquo;d say &ldquo;the
              thing has a name,&rdquo; there&rsquo;s probably a string.
            </p>
            <p>
              When you&rsquo;re building text procedurally, switch to a list buffer and join at the
              end. When you&rsquo;re searching, library functions usually beat the naive scan.
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
        title: "String.",
        body: (
          <>
            <p>
              The name is the obvious one. The mental model: <em>array of characters, immutable
              from the outside, indexed in constant time</em>. Most of the array cost rules apply
              directly; the only new thing is that &ldquo;mutating&rdquo; one character means
              building a new string.
            </p>
            <p>
              Open the drawer to see Python&rsquo;s string interface.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
