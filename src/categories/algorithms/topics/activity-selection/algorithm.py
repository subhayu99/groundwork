def fit_meetings(meetings: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Pick the most non-overlapping meetings for one room.

    Each meeting is (start, end). Sort by end time. Walk through them
    in order. Accept the next meeting whenever it starts at or after
    the last accepted meeting ended.
    """
    by_end = sorted(meetings, key=lambda m: m[1])

    chosen: list[tuple[int, int]] = []
    last_end = float("-inf")

    for start, end in by_end:
        if start >= last_end:
            chosen.append((start, end))
            last_end = end

    return chosen


# Why pick the earliest-ending meeting? Because freeing the room
# sooner can never hurt — every meeting that could have followed any
# other choice could also follow this one. So the locally best choice
# (free the room first) is never worse than any other.
#
# Greedy works here because that swap argument holds. When a similar
# argument fails — e.g., picking the largest coin first against the
# denominations {1, 12, 25} for the target 30 — greedy is wrong and
# you need dynamic programming instead.
