import type { PracticeProblem } from "@/shared/practice/types";

const hasPathSum = `class TreeNode:
    def __init__(self, val: int = 0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def has_path_sum(root: TreeNode | None, target: int) -> bool:
    """True if some root-to-leaf path adds up to target."""
    # An empty tree has no path at all.
    if root is None:
        return False

    # A leaf works only if the value left to spend matches exactly.
    if root.left is None and root.right is None:
        return root.val == target

    # Spend this node, then ask either child for the rest.
    remaining = target - root.val
    return has_path_sum(root.left, remaining) or has_path_sum(root.right, remaining)
`;

const maxAreaOfIsland = `def max_area_of_island(grid: list[list[int]]) -> int:
    """Largest connected blob of 1s, moving up/down/left/right."""
    rows, cols = len(grid), len(grid[0])

    def dfs(r: int, c: int) -> int:
        # Off the grid, or water/already-counted: contributes nothing.
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == 0:
            return 0

        # Sink this cell so we never revisit it, then add the neighbors.
        grid[r][c] = 0
        return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1)

    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                best = max(best, dfs(r, c))

    return best
`;

export const dfsProblems: PracticeProblem[] = [
  {
    id: "path-sum",
    title: "Path Sum",
    difficulty: "easy",
    teaser:
      "Decide whether any root-to-leaf path in a binary tree adds up to a target number.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given the root of a binary tree and a target integer. Return{" "}
          <code>True</code> if there is a path from the root down to a <em>leaf</em> (a node with
          no children) such that adding up all the values along that path equals the target.
        </p>
        <p>
          The path must end at a leaf &mdash; stopping partway down doesn&rsquo;t count, even if
          the running total already matches.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 5,000",
      "-1,000 ≤ node value ≤ 1,000",
      "Node values may be negative, so a running total can go up and down",
    ],
    examples: [
      {
        input: "root = [5, 4, 8, 11, null, 13, 4, 7, 2], target = 22",
        output: "True",
        note: "The path 5 → 4 → 11 → 2 sums to 22 and ends at a leaf.",
      },
      {
        input: "root = [1, 2, 3], target = 5",
        output: "False",
        note: "The two root-to-leaf paths sum to 3 and 4 — neither hits 5.",
      },
    ],
    hints: [
      <p>
        Think about what changes as you walk down one level. After you &ldquo;use&rdquo; a
        node&rsquo;s value, the rest of the path only has to make up the{" "}
        <em>remaining</em> amount &mdash; <code>target - node.val</code>.
      </p>,
      <p>
        That reframing turns the whole tree problem into the <em>same</em> problem on each child,
        just with a smaller target. This is the heart of depth-first search: solve the subtree,
        trusting the recursive call to handle the rest.
      </p>,
      <p>
        You only have a real answer at a leaf. The base cases are: an empty tree is{" "}
        <code>False</code>, and a leaf is <code>True</code> exactly when{" "}
        <code>node.val == target</code>. Everywhere else, return <code>True</code> if{" "}
        <em>either</em> child can finish the path.
      </p>,
    ],
    solution: hasPathSum,
    solutionWalkthrough: (
      <p>
        Each node is visited once, so the work is <code>O(n)</code> for <code>n</code> nodes. The
        recursion stack goes as deep as the tree is tall &mdash; <code>O(h)</code> &mdash; which is{" "}
        <code>O(log n)</code> for a balanced tree and <code>O(n)</code> for a degenerate, list-like
        one. The <code>or</code> short-circuits, so the moment one branch finds a valid path we
        stop exploring the other.
      </p>
    ),
  },
  {
    id: "max-area-of-island",
    title: "Max Area of Island",
    difficulty: "medium",
    teaser:
      "Find the largest connected group of 1s in a grid, where cells connect up, down, left, and right.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a grid of <code>0</code>s (water) and <code>1</code>s (land). An{" "}
          <em>island</em> is a group of <code>1</code>s connected horizontally or vertically &mdash;
          diagonals don&rsquo;t connect. Its <em>area</em> is the number of land cells it contains.
        </p>
        <p>
          Return the area of the largest island. If the grid has no land at all, return{" "}
          <code>0</code>.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "Each cell is exactly 0 or 1",
      "Cells connect in 4 directions only (no diagonals)",
    ],
    examples: [
      {
        input:
          "grid = [[0,0,1,0,0],[0,0,0,0,0],[0,1,1,0,1],[0,1,0,0,1],[0,1,0,0,1]]",
        output: "4",
        note: "The L-shaped island on the right (three stacked cells plus one) has area 4.",
      },
      {
        input: "grid = [[0,0,0],[0,0,0]]",
        output: "0",
        note: "No land anywhere, so the largest island is empty.",
      },
    ],
    hints: [
      <p>
        Picture standing on a single land cell. Its island is &ldquo;everything you can reach by
        stepping onto neighboring land.&rdquo; That reachability is exactly what depth-first search
        explores &mdash; follow the land outward until you run into water or the grid&rsquo;s edge.
      </p>,
      <p>
        The danger is counting the same cell twice and looping forever between two adjacent cells.
        The classic fix: as soon as you step onto a land cell, flip it to <code>0</code>. A
        &ldquo;sunk&rdquo; cell looks like water, so no later step revisits it.
      </p>,
      <p>
        Scan every cell. When you hit an unsunk <code>1</code>, run one DFS that returns the size
        of its whole island (1 for the current cell, plus the sizes returned by its four
        neighbors). Track the maximum across all those DFS calls.
      </p>,
    ],
    solution: maxAreaOfIsland,
    solutionWalkthrough: (
      <p>
        Every cell is touched a constant number of times &mdash; once by the outer scan, and a few
        times as a DFS neighbor &mdash; so the runtime is <code>O(rows &times; cols)</code>. Sinking
        each visited cell to <code>0</code> doubles as the &ldquo;visited&rdquo; marker, so we need
        no extra grid; the only extra space is the recursion stack, which in the worst case (one
        giant snaking island) can reach <code>O(rows &times; cols)</code> deep.
      </p>
    ),
  },
];
