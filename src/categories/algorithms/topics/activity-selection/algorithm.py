def fit_meetings(meetings: list[tuple[int, int]]) -> list[tuple[int, int]]:  # @sync: sig
    """Pick the most non-overlapping meetings for one room.

    Each meeting is (start, end). Sort by end time. Walk through them
    in order. Accept the next meeting whenever it starts at or after
    the last accepted meeting ended.
    """
    by_end = sorted(meetings, key=lambda m: m[1])  # @sync: sort

    chosen: list[tuple[int, int]] = []  # @sync: result_init
    last_end = float("-inf")  # @sync: last_end

    for start, end in by_end:  # @sync: loop
        if start >= last_end:  # @sync: compatible
            chosen.append((start, end))  # @sync: select
            last_end = end  # @sync: update

    return chosen  # @sync: result


# Why pick the earliest-ending meeting? Because freeing the room
# sooner can never hurt — every meeting that could have followed any
# other choice could also follow this one. So the locally best choice
# (free the room first) is never worse than any other.
#
# Greedy works here because that swap argument holds. When a similar
# argument fails — e.g., picking the largest coin first against the
# denominations {1, 12, 25} for the target 30 — greedy is wrong and
# you need dynamic programming instead.
