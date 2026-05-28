import { DerivationStep } from "@/shared/derivation/types";

export const recursionSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "How big is your Downloads folder?",
        body: (
          <>
            <p>
              You open your Downloads folder to free up space. Inside are some files and some
              folders. Inside <em>those</em> folders are more files and more folders. The phone
              just shows you a number: <code>14.2 GB</code>. How does it know?
            </p>
            <p>
              The straight answer: add up the size of every file. The problem is you can&rsquo;t
              see them all at once. They&rsquo;re hiding behind folders, behind more folders.
            </p>
          </>
        ),
        actionLabel: "Try the obvious thing",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Loops inside loops inside loops.",
        body: (
          <>
            <p>
              Walk the top-level items. If it&rsquo;s a file, add its size. If it&rsquo;s a folder,
              loop over its contents. If <em>that</em> contains a folder, loop again. And again.
            </p>
            <p>
              You can write the loops down for two levels. Three. Four. But the folders aren&rsquo;t
              promised to stop at any fixed depth. You can&rsquo;t write loops for a depth you
              don&rsquo;t know in advance.
            </p>
            <p>
              There&rsquo;s something the same about each loop, though. Every time we open a folder,
              we&rsquo;re doing the exact same job: <em>add up the size of everything inside</em>.
              The job doesn&rsquo;t change. Only the folder changes.
            </p>
          </>
        ),
        actionLabel: "Notice the repeat",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Open the folder. It contains a smaller version of the same problem.",
        body: (
          <>
            <p>
              On the right is a folder tree. Click a folder to peek inside. Notice what you find:
              files (with sizes) and more folders. The smaller folders have the same shape as the
              outer one &mdash; some files, some folders.
            </p>
            <p>
              If you knew the size of every subfolder, the answer for the outer folder would be:
              add up the file sizes you can see, plus the size of each subfolder. Done.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: each subfolder is <em>the same problem</em> as the original, just on
              fewer items.
            </div>
          </>
        ),
        actionLabel: "Let the function call itself",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Write the rule. The function calls itself.",
        body: (
          <>
            <p>
              Define <code>folder_size(node)</code>. Two cases.
            </p>
            <p>
              <strong>File.</strong> The node is a file. Return its size. Stop.
            </p>
            <p>
              <strong>Folder.</strong> The node is a folder. Walk its children. For each child,
              call <code>folder_size(child)</code> &mdash; the function asks itself the same
              question on a smaller piece. Add the answers up. Return the total.
            </p>
            <p>
              The function calling itself is fine because each call is on something{" "}
              <strong>strictly smaller</strong> &mdash; a child of the folder we&rsquo;re standing
              in, never the folder itself. We can&rsquo;t loop forever because we keep shrinking.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>decomposition</em>. Solve a problem by solving a
              smaller version of itself.
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
        label: "The operations",
        title: "Each file and each folder is touched once.",
        body: (
          <>
            <p>
              Every node in the tree &mdash; every file, every folder &mdash; gets looked at
              exactly one time. That&rsquo;s <code>O(n)</code> (cost grows in step with how many
              items are in the tree, including folders).
            </p>
            <p>
              <strong>Memory:</strong> the function calls stack up. Each open call is waiting for
              its children to finish. The deepest the stack can get is the deepest folder nesting
              in the tree. If your tree is balanced and 30 levels deep, that&rsquo;s 30 calls on
              the stack at peak.
            </p>
            <p>
              If the tree is <em>extremely</em> deep (think a million-level chain), the stack can
              run out. Most languages cap it around 1,000&ndash;10,000 calls. For real file systems
              that&rsquo;s never the limit. For artificial worst cases, you&rsquo;d convert the
              recursion into an explicit stack &mdash; we&rsquo;ll see that pattern later.
            </p>
          </>
        ),
        actionLabel: "Same shape, new questions",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Tree-shaped data is everywhere.",
        body: (
          <>
            <p>
              The same trick works on anything that branches into smaller copies of itself.
            </p>
            <p>
              JSON: an object contains values that might be other objects. Count keys.
            </p>
            <p>
              HTML: a div contains divs that contain divs. Compute total height.
            </p>
            <p>
              Math expressions: <code>(2 + (3 * (4 - 1)))</code>. Each parenthesized piece is a
              smaller expression you can evaluate the same way.
            </p>
            <p>
              File system permissions; nested comments on a thread; org-chart head-count; outline
              indent levels; XML; parser ASTs; the way a chess engine looks ahead. All the same
              shape: solve me by solving my children.
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
        title: "Recursion.",
        body: (
          <>
            <p>
              That&rsquo;s the name. The function calls itself on a smaller version of the same
              problem. The two non-negotiable pieces:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>A base case.</strong> A version of the problem so small the answer is
                obvious without calling yourself. Here, a file knows its own size.
              </li>
              <li>
                <strong>A recursive case.</strong> Reduce the work to one or more strictly smaller
                copies of the same problem. Combine their answers. Return.
              </li>
            </ul>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The input is tree-shaped or nested</li>
              <li>The answer for a piece depends on the answer for its parts</li>
              <li>You catch yourself writing &ldquo;a loop inside a loop inside a loop&rdquo;</li>
            </ul>
            <p>
              Open the drawer for the Python. Five lines of work; the rest is the rule, written
              down.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
