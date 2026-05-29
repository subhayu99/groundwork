import { DerivationStep } from "@/shared/derivation/types";

export const treesSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "A company has people. People have managers. Managers have managers.",
        body: (
          <>
            <p>
              Open any folder on your computer. It contains files and other folders, which contain
              more files and folders. Reply to a comment. Someone replies to your reply. The
              conversation forms a tree.
            </p>
            <p>
              These aren&rsquo;t sequences. They branch. A flat list doesn&rsquo;t capture &ldquo;who
              reports to whom&rdquo; or &ldquo;what&rsquo;s inside what.&rdquo;
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
        title: "Flatten it into a list. Watch the structure die.",
        body: (
          <>
            <p>
              You could store every employee in a flat list and add a column called <em>manager</em>.
              Looking up &ldquo;who does Bob report to?&rdquo; is fast. But asking &ldquo;everyone in
              Bob&rsquo;s subtree&rdquo; means walking the whole table.
            </p>
            <p>
              The shape of the data is hierarchy. The shape of the storage is row-by-row. The
              mismatch hurts every query.
            </p>
          </>
        ),
        actionLabel: "Let the shape lead",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Click a node. See only its branch light up.",
        body: (
          <>
            <p>
              On the right is a small org chart. Each node knows about its direct reports &mdash;
              that&rsquo;s the only pointer it holds. Click someone in the middle and watch what
              happens below.
            </p>
            <p>
              You didn&rsquo;t walk the whole company. You followed pointers from the manager you
              clicked. The structure is doing the navigation for you.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what does &ldquo;a child&rdquo; look like in this
              structure? And how is it different from a sibling?
            </div>
          </>
        ),
        actionLabel: "Each node points to its kids",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "Nodes with pointers to children. No cycles.",
        body: (
          <>
            <p>
              A <strong>tree</strong> is just nodes &mdash; like a linked list, but each node can
              hold <em>multiple</em> child pointers instead of one <em>next</em>.
            </p>
            <p>
              There&rsquo;s a single starting point called the <em>root</em>. Every other node is
              reached by following child pointers downward. No node points back up to a parent (or
              it&rsquo;d be a cycle, and we&rsquo;d call it a <em>graph</em>).
            </p>
            <p>
              A <em>binary tree</em> restricts each node to two children, often called <em>left</em>{" "}
              and <em>right</em>. That restriction unlocks tighter operations.
            </p>
          </>
        ),
        actionLabel: "What operations?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Walk the whole tree, or take a sorted shortcut.",
        body: (
          <>
            <p>
              <strong>Traversal:</strong> visit every node. <em>Depth-first</em> goes down a branch
              before returning, <em>breadth-first</em> visits level by level. Both are{" "}
              <code>O(n)</code> (cost grows in step with the number of nodes) because you touch each node once.
            </p>
            <p>
              <strong>Binary Search Tree:</strong> store values such that everything in the left
              subtree is smaller and everything on the right is larger. Now lookups are a sequence of
              left/right decisions &mdash; <code>O(log n)</code> (cost grows very slowly; doubling the size of the tree only adds one more step) if the tree is balanced. (When
              it&rsquo;s not, balance keepers like AVL or red-black trees rebalance after each
              insert.)
            </p>
            <p>
              <strong>The catch:</strong> hash maps do <code>O(1)</code> (instant) lookups, so we only reach
              for a BST when we need <em>ordering</em> &mdash; e.g., range queries, next-larger
              lookups, sorted iteration.
            </p>
          </>
        ),
        actionLabel: "When trees fit",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When it fits",
        title: "Hierarchy. Decisions. Sorted lookups with range queries.",
        body: (
          <>
            <p>
              Reach for a <strong>tree</strong> any time the data is genuinely hierarchical: file
              systems, DOMs, scene graphs in games, syntax trees in parsers, decision trees in ML,
              category nesting in an e-commerce site.
            </p>
            <p>
              Reach for a <strong>BST</strong> (or one of its balanced cousins) when you need fast
              lookups <em>and</em> ordered iteration or range queries &mdash; databases use B-trees,
              which are a wide-branching cousin of BSTs.
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
        label: "The structure",
        title: "Tree.",
        body: (
          <>
            <p>
              That&rsquo;s the name. Variants you&rsquo;ll meet later: <em>binary trees</em>,{" "}
              <em>binary search trees</em>, <em>heaps</em> (a tree-shaped priority queue),{" "}
              <em>tries</em> (a tree of prefix characters), <em>B-trees</em> (the engine of database
              indexes), and many more &mdash; but they&rsquo;re all the same skeleton: nodes with
              child pointers, rooted at the top.
            </p>
            <p>
              Open the Code panel for two tiny Python sketches &mdash; a general tree and a binary
              search tree.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
