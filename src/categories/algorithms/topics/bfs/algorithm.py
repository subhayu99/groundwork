from collections import deque

Cell = tuple[int, int]


def shortest_steps(grid: list[list[int]], start: Cell, end: Cell) -> int:  # @sync: sig
    """Fewest up/down/left/right steps from start to end, or -1 if blocked.

    0 means open, 1 means a wall. The trick is to walk outward from
    start one ring at a time. The first time we touch end, we've
    walked the smallest possible number of rings to get there.
    """
    rows = len(grid)                  # @sync: rows
    cols = len(grid[0])               # @sync: cols

    # Each cell gets queued exactly once, the first time we see it.
    seen: set[Cell] = {start}         # @sync: seen

    # The queue holds (cell, distance-from-start) pairs.
    queue: deque[tuple[Cell, int]] = deque([(start, 0)])  # @sync: init_queue

    while queue:                      # @sync: loop
        (r, c), d = queue.popleft()   # @sync: dequeue

        if (r, c) == end:             # @sync: visit
            return d  # First time we see end is the shortest distance. @sync: found

        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):  # @sync: neighbors
            nr, nc = r + dr, c + dc
            in_bounds = 0 <= nr < rows and 0 <= nc < cols
            if in_bounds and grid[nr][nc] == 0 and (nr, nc) not in seen:  # @sync: seen_check
                seen.add((nr, nc))            # @sync: mark
                queue.append(((nr, nc), d + 1))  # @sync: enqueue

    return -1  # No path.


# Why this gives the SHORTEST distance and DFS doesn't:
#
# The queue is FIFO. Every cell at distance d gets pulled out before
# any cell at distance d+1. So by the time we touch end, we've already
# checked every cell that's closer than end is. There's no shorter
# route hiding behind us.
#
# DFS would also find a path, but it goes all the way down one branch
# before trying the next. That branch might be a long way around.
