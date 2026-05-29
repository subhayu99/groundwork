def n_queens(n: int) -> list[list[int]]:  # @sync: sig
    """Place n queens on an n x n board so no two attack each other.

    Each result is a list of column positions, one per row.
    [1, 3, 0, 2] means: row 0 queen in col 1, row 1 in col 3, etc.
    """
    solutions: list[list[int]] = []  # @sync: init

    def safe(placed: list[int], col: int) -> bool:
        # placed[r] holds the column of the queen in row r.
        # The new queen goes in the next row down.
        row = len(placed)
        for r, c in enumerate(placed):
            same_col = c == col
            same_diag = abs(c - col) == abs(r - row)
            if same_col or same_diag:
                return False
        return True

    def place(placed: list[int]) -> None:
        if len(placed) == n:  # @sync: record_solution
            solutions.append(placed[:])  # @sync: record_append
            return

        # Try every column for the next row. The "safe" check is the
        # prune — we never even recurse into branches that can't lead
        # to a full solution.
        for col in range(n):  # @sync: loop
            if safe(placed, col):  # @sync: is_safe
                placed.append(col)  # @sync: place
                place(placed)  # @sync: recurse
                placed.pop()  # Undo. Try the next column. @sync: backtrack

    place([])
    return solutions


# What backtracking buys: brute force would try n^n placements — for
# n=8 that's 16 million. With the safety check we explore a tiny
# fraction of those, because the moment a partial board is unsafe we
# abandon every continuation of it. The "undo and try next" motion
# is what makes the search shrink.
