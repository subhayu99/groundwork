import type { PracticeProblem } from "@/shared/practice/types";

const maxDepth = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def max_depth(root: TreeNode | None) -> int:
    """Number of nodes on the longest root-to-leaf path."""
    # An empty tree contributes no levels.
    if root is None:
        return 0

    # The depth below this node is the deeper of its two children,
    # plus one for the node we're standing on.
    return 1 + max(max_depth(root.left), max_depth(root.right))
`;

const invertTree = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def invert_tree(root: TreeNode | None) -> TreeNode | None:
    """Mirror the tree by swapping every node's two children."""
    # Nothing to mirror once we fall off the bottom.
    if root is None:
        return None

    # Swap this node's children, then mirror each subtree.
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
`;

export const treesProblems: PracticeProblem[] = [
  {
    id: "maximum-depth-of-a-binary-tree",
    title: "Maximum Depth of a Binary Tree",
    difficulty: "easy",
    teaser: "Find how many levels deep a binary tree goes.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given the <code>root</code> of a binary tree. Return its{" "}
          <em>maximum depth</em> &mdash; the number of nodes along the longest path from the
          root down to the farthest leaf.
        </p>
        <p>
          An empty tree (<code>root</code> is <code>None</code>) has depth <code>0</code>. A
          single node has depth <code>1</code>.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 10,000",
      "−100 ≤ Node.val ≤ 100",
    ],
    examples: [
      {
        input: "root = [3, 9, 20, null, null, 15, 7]",
        output: "3",
        note: "Root 3 → 20 → 15 (or 7) is the longest path: three nodes deep.",
      },
      {
        input: "root = [1, null, 2]",
        output: "2",
        note: "A lone right child hangs one level below the root.",
      },
    ],
    hints: [
      <p>
        The depth of a tree only depends on its two subtrees. If you already knew how deep the
        left subtree was and how deep the right subtree was, the whole tree&rsquo;s depth would
        just be the larger of those, plus the root itself. That &ldquo;already knew&rdquo; is a
        signal for <code>recursion</code>.
      </p>,
      <p>
        Pin down the base case first: an empty tree (<code>root is None</code>) has depth{" "}
        <code>0</code>. Every recursive call eventually hits this when it walks past a leaf, so
        the recursion is guaranteed to stop.
      </p>,
      <p>
        For a real node, recurse into both children, take{" "}
        <code>max(max_depth(root.left), max_depth(root.right))</code>, and add{" "}
        <code>1</code> for the current node. Each node is visited once, so the whole thing is{" "}
        <code>O(n)</code>.
      </p>,
    ],
    solution: maxDepth,
    solutionWalkthrough: (
      <p>
        Each call does constant work &mdash; one comparison and one addition &mdash; and we make
        exactly one call per node, so the time is <code>O(n)</code>. The recursion stack reaches
        as deep as the tree itself, giving <code>O(h)</code> extra space, where <code>h</code>{" "}
        is the height.
      </p>
    ),
  },
  {
    id: "invert-a-binary-tree",
    title: "Invert a Binary Tree",
    difficulty: "easy",
    teaser: "Produce the mirror image of a binary tree.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given the <code>root</code> of a binary tree. Invert it &mdash; turn it
          into its mirror image &mdash; and return the new <code>root</code>.
        </p>
        <p>
          Inverting means that at <em>every</em> node, the left and right children trade places.
          Do this top to bottom for the entire tree.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 10,000",
      "−100 ≤ Node.val ≤ 100",
    ],
    examples: [
      {
        input: "root = [4, 2, 7, 1, 3, 6, 9]",
        output: "[4, 7, 2, 9, 6, 3, 1]",
        note: "At each level the children flip: 2 and 7 swap, then 1/3 and 6/9 swap.",
      },
      {
        input: "root = [1, 2]",
        output: "[1, null, 2]",
        note: "The single left child becomes the right child.",
      },
    ],
    hints: [
      <p>
        Notice the rule is the same at <em>every</em> node: swap its two children. A rule that
        applies identically to a node and to each of its subtrees is the classic shape for{" "}
        <code>recursion</code>.
      </p>,
      <p>
        Handle the empty case first: if <code>root is None</code>, there&rsquo;s nothing to flip,
        so return <code>None</code>. This is the base case that stops the recursion at the
        leaves.
      </p>,
      <p>
        For a real node, swap its children &mdash; but make sure each subtree is itself inverted.
        Python lets you do both in one line:{" "}
        <code>root.left, root.right = invert_tree(root.right), invert_tree(root.left)</code>. The
        right-hand side is fully evaluated before assignment, so the swap is safe.
      </p>,
    ],
    solution: invertTree,
    solutionWalkthrough: (
      <p>
        We touch every node exactly once, swapping its two child pointers in constant time, so the
        run time is <code>O(n)</code>. The recursion stack grows with the tree&rsquo;s height,
        adding <code>O(h)</code> space.
      </p>
    ),
  },
];
