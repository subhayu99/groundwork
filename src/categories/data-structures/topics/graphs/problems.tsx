import type { PracticeProblem } from "@/shared/practice/types";

const floodFill = `def flood_fill(
    image: list[list[int]], sr: int, sc: int, color: int
) -> list[list[int]]:
    """Recolor the region of same-colored cells reachable from (sr, sc)."""
    rows, cols = len(image), len(image[0])
    start = image[sr][sc]

    # Nothing to do if the pixel already wears the new color.
    if start == color:
        return image

    def dfs(r: int, c: int) -> None:
        # Stop at the grid edge or any pixel of a different color.
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if image[r][c] != start:
            return

        image[r][c] = color  # Paint, which also marks it visited.
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    dfs(sr, sc)
    return image
`;

const numIslands = `def num_islands(grid: list[list[str]]) -> int:
    """Count connected groups of '1' land cells (4-directional)."""
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    count = 0

    def sink(r: int, c: int) -> None:
        # Bail on out-of-bounds or water/visited cells.
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return
        if grid[r][c] != "1":
            return

        grid[r][c] = "0"  # Sink this land so we never revisit it.
        sink(r + 1, c)
        sink(r - 1, c)
        sink(r, c + 1)
        sink(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1      # New island discovered.
                sink(r, c)      # Sink its entire landmass.

    return count
`;

export const graphsProblems: PracticeProblem[] = [
  {
    id: "flood-fill",
    title: "Flood Fill",
    difficulty: "easy",
    teaser:
      "Starting from one pixel, repaint every same-colored cell connected to it.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a 2D grid <code>image</code> where each cell holds an
          integer color. You&rsquo;re also given a starting pixel at row{" "}
          <code>sr</code>, column <code>sc</code>, and a new <code>color</code>.
        </p>
        <p>
          Repaint the starting pixel, then spread outward: any cell that touches an
          already-painted cell <em>up, down, left, or right</em> and shares the{" "}
          <em>original</em> color gets the new color too. Return the modified grid.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "0 ≤ image[r][c], color &lt; 2^16",
      "0 ≤ sr &lt; rows, 0 ≤ sc &lt; cols",
    ],
    examples: [
      {
        input: "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2",
        output: "[[2,2,2],[2,2,0],[2,0,1]]",
        note: "Every 1 connected to the center turns into a 2; the lone bottom-right 1 is diagonal-only, so it stays.",
      },
      {
        input: "image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0",
        output: "[[0,0,0],[0,0,0]]",
        note: "The new color equals the old color, so nothing changes.",
      },
    ],
    hints: [
      <p>
        Think of the painted region as everything reachable from{" "}
        <code>(sr, sc)</code> by hopping between neighbors that share the original
        color. That &ldquo;reachable from a start&rdquo; shape is exactly what a depth-first
        search explores.
      </p>,
      <p>
        Record the original color <code>start = image[sr][sc]</code> <em>before</em>{" "}
        you change anything. Each recursive call should stop when it falls off the
        grid or lands on a cell whose color isn&rsquo;t <code>start</code>.
      </p>,
      <p>
        There&rsquo;s a subtle trap: if <code>start == color</code>, painting a cell
        doesn&rsquo;t change it, so your visited check never trips and the recursion
        loops forever. Guard against that up front by returning early when the colors
        already match.
      </p>,
    ],
    solution: floodFill,
    solutionWalkthrough: (
      <p>
        The DFS visits each cell at most once &mdash; once painted, a cell no longer
        matches <code>start</code>, so it&rsquo;s never re-entered. With{" "}
        <code>r</code> rows and <code>c</code> columns that&rsquo;s{" "}
        <code>O(r &times; c)</code> time and, in the worst case (one giant region),{" "}
        <code>O(r &times; c)</code> recursion depth.
      </p>
    ),
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "medium",
    teaser:
      "Count how many separate landmasses appear in a grid of land and water cells.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a 2D grid where <code>&apos;1&apos;</code> is land and{" "}
          <code>&apos;0&apos;</code> is water. An <em>island</em> is a group of{" "}
          <code>&apos;1&apos;</code> cells connected horizontally or vertically (not
          diagonally).
        </p>
        <p>
          Return the number of distinct islands. You may assume all four edges of the
          grid are surrounded by water.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ rows, cols ≤ 300",
      "grid[r][c] is either '0' or '1'",
    ],
    examples: [
      {
        input:
          'grid = [["1","1","0","0"],["1","1","0","0"],["0","0","1","0"],["0","0","0","1"]]',
        output: "3",
        note: "A 2×2 block in the top-left, plus two single-cell islands on the diagonal.",
      },
      {
        input: 'grid = [["1","1","1"],["0","1","0"],["1","1","1"]]',
        output: "1",
        note: "Every land cell links to its neighbors through the middle row and column, forming one island.",
      },
    ],
    hints: [
      <p>
        Each island is a connected blob of <code>&apos;1&apos;</code>s. If you scan the
        grid cell by cell and find an unvisited land cell, you&rsquo;ve found a brand-new
        island &mdash; increment your counter.
      </p>,
      <p>
        After counting a new island, you need to make sure you don&rsquo;t count any of
        its other cells again. Launch a DFS from that cell and visit the whole blob, one
        neighbor at a time in the four cardinal directions.
      </p>,
      <p>
        Instead of a separate <code>visited</code> set, you can flip each visited land
        cell to <code>&apos;0&apos;</code> as you go (&ldquo;sinking&rdquo; it). That keeps
        it from being recounted and uses no extra grid-sized memory.
      </p>,
    ],
    solution: numIslands,
    solutionWalkthrough: (
      <p>
        The outer double loop touches every cell once, and the <code>sink</code> DFS
        visits each land cell exactly once over the whole run (a sunk cell is never
        re-entered). Total work is <code>O(rows &times; cols)</code>, with recursion
        depth bounded by the size of the largest island.
      </p>
    ),
  },
];
