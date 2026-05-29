import type { PracticeProblem } from "@/shared/practice/types";

const levelOrder = `from collections import deque


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def level_order(root: TreeNode | None) -> list[list[int]]:
    """Return node values grouped level by level, top to bottom."""
    if root is None:
        return []

    levels: list[list[int]] = []
    queue = deque([root])

    while queue:
        # Freeze the size now: this is exactly one full level.
        level_size = len(queue)
        current = []

        for _ in range(level_size):
            node = queue.popleft()
            current.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        levels.append(current)

    return levels
`;

const rottingOranges = `from collections import deque


def oranges_rotting(grid: list[list[int]]) -> int:
    """Minutes until every fresh orange rots, or -1 if some never can."""
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0

    # Seed the queue with every rotten orange — all sources start at once.
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1

    if fresh == 0:
        return 0

    minutes = 0
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    # Each pass through the current queue is one minute of spreading.
    while queue and fresh:
        minutes += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))

    return minutes if fresh == 0 else -1
`;

export const bfsProblems: PracticeProblem[] = [
  {
    id: "binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    teaser: "Return a binary tree's node values grouped level by level, from the root downward.",
    prompt: (
      <div className="space-y-3">
        <p>
          Given the <code>root</code> of a binary tree, return its <em>level-order</em>{" "}
          traversal: a list of lists, where each inner list holds the values on one level,
          read left to right, starting from the root.
        </p>
        <p>
          Each node is a <code>TreeNode</code> with a <code>val</code> plus <code>left</code>{" "}
          and <code>right</code> children. An empty tree (<code>root is None</code>) returns an
          empty list.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 2,000",
      "-1,000 ≤ node value ≤ 1,000",
    ],
    examples: [
      {
        input: "root = [3, 9, 20, null, null, 15, 7]",
        output: "[[3], [9, 20], [15, 7]]",
        note: "Root level is [3]; its children are [9, 20]; the leaves under 20 are [15, 7].",
      },
      {
        input: "root = [1]",
        output: "[[1]]",
        note: "A single node is its own level.",
      },
    ],
    hints: [
      <p>
        Depth-first recursion visits a whole subtree before its sibling, so it mixes levels
        together. To keep levels separate you want to visit nodes in the order they sit in the
        tree &mdash; breadth-first, one ring at a time.
      </p>,
      <p>
        A queue does exactly that: pop a node, then push its children to the back. Because
        children always enter behind everything already waiting, the queue empties strictly in
        level order. Reach for <code>collections.deque</code> so <code>popleft()</code> is{" "}
        <code>O(1)</code>.
      </p>,
      <p>
        The trick for grouping: at the top of each loop, record{" "}
        <code>level_size = len(queue)</code>. Those are precisely the nodes on the current
        level. Pop exactly that many, collect their values into one list, and enqueue their
        children for the next round.
      </p>,
    ],
    solution: levelOrder,
    solutionWalkthrough: (
      <p>
        Every node is enqueued and dequeued exactly once, so the work is <code>O(n)</code> for{" "}
        <code>n</code> nodes. Snapshotting <code>len(queue)</code> before each inner loop draws a
        clean boundary between levels &mdash; the children pushed during a pass only get read on
        the <em>next</em> pass. Memory is <code>O(w)</code> where <code>w</code> is the widest
        level, since that&rsquo;s the most the queue ever holds at once.
      </p>
    ),
  },
  {
    id: "rotting-oranges",
    title: "Rotting Oranges",
    difficulty: "medium",
    teaser: "Find how many minutes until every fresh orange rots, given rot spreads to neighbors each minute.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a grid where each cell is <code>0</code> (empty), <code>1</code>{" "}
          (a fresh orange), or <code>2</code> (a rotten orange). Every minute, any fresh orange
          that is 4-directionally adjacent to a rotten one becomes rotten too.
        </p>
        <p>
          Return the minimum number of minutes that must pass until no cell has a fresh orange.
          If some fresh orange can never rot (it&rsquo;s walled off from all rot), return{" "}
          <code>-1</code>.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ rows, cols ≤ 10",
      "Each cell is 0, 1, or 2",
    ],
    examples: [
      {
        input: "grid = [[2, 1, 1], [1, 1, 0], [0, 1, 1]]",
        output: "4",
        note: "Rot fans out from the top-left corner; the bottom-right orange is the last to turn.",
      },
      {
        input: "grid = [[2, 1, 1], [0, 1, 1], [1, 0, 1]]",
        output: "-1",
        note: "The fresh orange in the bottom-left is fenced off by empty cells and never rots.",
      },
    ],
    hints: [
      <p>
        Notice that rot spreads from <em>every</em> rotten orange simultaneously, not from a
        single starting point. So this isn&rsquo;t one BFS from one source &mdash; it&rsquo;s a
        BFS that begins from <em>all</em> rotten oranges at the same instant.
      </p>,
      <p>
        Seed a <code>collections.deque</code> with the coordinates of every cell that starts as{" "}
        <code>2</code>, and count how many fresh oranges (<code>1</code>) exist. Each &ldquo;wave&rdquo;
        of the BFS &mdash; one full drain of the queue&rsquo;s current contents &mdash; is one
        minute. Snapshot <code>len(queue)</code> just like in level-order traversal.
      </p>,
      <p>
        Decrement your fresh count each time you rot a neighbor. When the BFS finishes, if any
        fresh oranges remain (<code>fresh &gt; 0</code>) they were unreachable, so return{" "}
        <code>-1</code>. Watch the edge case where there are zero fresh oranges to begin with:
        the answer is <code>0</code> minutes.
      </p>,
    ],
    solution: rottingOranges,
    solutionWalkthrough: (
      <p>
        Loading all rotten cells into the queue up front turns the problem into a single
        multi-source BFS: the rot fronts advance in lockstep, so the layer at which a fresh
        orange is reached equals the minute it rots. Each cell is enqueued at most once, giving{" "}
        <code>O(rows &times; cols)</code> time. Tracking the <code>fresh</code> count lets us
        distinguish &ldquo;all rotted&rdquo; from &ldquo;some sealed off&rdquo; in <code>O(1)</code>{" "}
        at the end, instead of re-scanning the grid.
      </p>
    ),
  },
];
