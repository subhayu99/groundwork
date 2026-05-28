import { DerivationStep } from "@/shared/derivation/types";

export const linkedListsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Add one item to a sorted list. Without disturbing the rest.",
        body: (
          <>
            <p>
              You keep a tidy list of friends in alphabetical order. A new friend, <em>Charlie</em>,
              shows up. Everyone from <em>D</em> onward will have to shuffle down one spot to make
              room.
            </p>
            <p>
              That&rsquo;s fine for ten names. Less fine for ten million. Is there a way to insert
              without disturbing the people who don&rsquo;t care that Charlie exists?
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
        title: "Arrays force a domino effect.",
        body: (
          <>
            <p>
              In an array, addresses are positions. Inserting Charlie at index 2 means: index 3 now
              has to be Dana, index 4 has to be Eli, index 5 has to be Frank, and so on.
            </p>
            <p>
              Every name after Charlie has to physically move. <code>O(n)</code> copies for one
              insertion. The information itself didn&rsquo;t change &mdash; the <em>positions</em>{" "}
              forced the work.
            </p>
            <p>
              What if positions weren&rsquo;t fixed?
            </p>
          </>
        ),
        actionLabel: "Free the positions",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Each card points to the next.",
        body: (
          <>
            <p>
              On the right are cards connected by arrows. Each card holds a value <em>and</em> an
              arrow telling you where the next card lives. The order is in the arrows, not in the
              positions on screen.
            </p>
            <p>
              Click <em>insert after 2</em>. Watch what changes. Then click <em>remove 4</em>. Look
              at how few things actually move.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> when you slide a new card in, how many existing
              cards had to change?
            </div>
          </>
        ),
        actionLabel: "Pointers are the trick",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "Nodes. Each one holds a value and the address of the next.",
        body: (
          <>
            <p>
              A <strong>linked list</strong> is a chain of small boxes, each one carrying a value
              and a pointer to the next box. To walk the list you start at the <em>head</em> and
              follow arrows until you hit <code>None</code>.
            </p>
            <p>
              The trade is direct. You give up free random access &mdash; there&rsquo;s no{" "}
              <code>list[487]</code> &mdash; and you give up locality in memory. In return you get
              constant-time insertion and removal anywhere, as long as you&rsquo;re standing next
              to the right node.
            </p>
          </>
        ),
        actionLabel: "What's cheap?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Cheap edits, expensive lookups.",
        body: (
          <>
            <p>
              <strong>Insert after a known node:</strong> <code>O(1)</code>. Two pointer
              reassignments and the new node is in.
            </p>
            <p>
              <strong>Remove a known node&rsquo;s successor:</strong> <code>O(1)</code>. One
              pointer reassigned. The orphan gets collected.
            </p>
            <p>
              <strong>Find a value:</strong> <code>O(n)</code>. You have to walk from the head.
              There&rsquo;s no shortcut.
            </p>
            <p>
              <strong>Random access by index:</strong> <code>O(n)</code>. Same reason.
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
        title: "Heavy mid-edits, no random access. And it's how other structures think.",
        body: (
          <>
            <p>
              Honest answer: in modern Python you almost never reach for a linked list directly. The
              jobs that need O(1) middle edits usually use a different structure (a deque, an
              ordered map, a tree).
            </p>
            <p>
              You still <em>need</em> linked lists because they&rsquo;re the mental model for other
              things. A tree is just nodes pointing at multiple children. A graph is nodes pointing
              at arbitrary other nodes. Linked-list intuition is the foundation; the literal list
              is the simplest case.
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
        label: "The structure",
        title: "Linked List.",
        body: (
          <>
            <p>
              That&rsquo;s the name. <em>Singly linked</em> if each node has one pointer (to next).{" "}
              <em>Doubly linked</em> if each node has two (to next and previous &mdash; lets you
              walk backwards and unlink without knowing the predecessor).
            </p>
            <p>
              The big idea: position is not address. Order is whatever the arrows say. Insertion and
              removal cost what they should &mdash; one pointer swap.
            </p>
            <p>
              Open the drawer to see a tiny Python sketch.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
