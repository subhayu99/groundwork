def ways_to_climb(n: int) -> int:
    """How many distinct ways can you climb n stairs, taking 1 or 2 at a time?

    ways(n) = ways(n - 1) + ways(n - 2)
              one-step last         two-step last

    ways(0) = 1 (one way to "do nothing")
    ways(1) = 1
    """
    # Tabulation: build the answer bottom-up. We only ever need the
    # last two values, so two ints are all the memory we need.
    if n <= 1:
        return 1

    a, b = 1, 1  # ways(n-2), ways(n-1)
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


# The same problem with memoization, for the readers who think of
# recursion first:
#
# from functools import lru_cache
#
# @lru_cache(maxsize=None)
# def ways(n: int) -> int:
#     if n <= 1:
#         return 1
#     return ways(n - 1) + ways(n - 2)
#
# Both forms compute the same n+1 numbers. The recursive form lets
# you write the rule almost word-for-word; the loop form is faster
# in practice because it skips the function-call overhead.
