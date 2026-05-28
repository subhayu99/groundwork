Cell = tuple[int, int]


def find_path(grid: list[list[int]], start: Cell, end: Cell) -> list[Cell] | None:
    """Return any path of open cells from start to end, or None.

    0 means open, 1 means a wall. Movement is up/down/left/right.
    Each cell is visited at most once, so the total work is bounded
    by the size of the grid.
    """
    rows = len(grid)
    cols = len(grid[0])
    visited: set[Cell] = set()

    def explore(r: int, c: int, trail: list[Cell]) -> list[Cell] | None:
        # Reached the goal? Hand the trail back up the call stack.
        if (r, c) == end:
            return trail

        visited.add((r, c))

        # Try each of the four neighbours in turn.
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            in_bounds = 0 <= nr < rows and 0 <= nc < cols
            if in_bounds and grid[nr][nc] == 0 and (nr, nc) not in visited:
                found = explore(nr, nc, trail + [(nr, nc)])
                if found is not None:
                    return found

        # Dead end. The for-loop ends. We return None and the caller
        # tries its next neighbour. That return-and-back-up motion is
        # what people mean by "backtracking".
        return None

    return explore(start[0], start[1], [start])
