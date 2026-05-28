def binary_search(arr: list[int], target: int) -> int:
    """Find the index of target in a sorted array, or -1 if absent.

    Each comparison eliminates half of the remaining search space.
    """
    lo = 0
    hi = len(arr) - 1

    while lo <= hi:
        mid = (lo + hi) // 2          # midpoint; integer division
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1               # answer is in the right half
        else:
            hi = mid - 1               # answer is in the left half

    return -1


# Off-by-one is the gotcha. Two correct conventions:
#   1. lo <= hi  with hi = len(arr) - 1   (this version)
#   2. lo <  hi  with hi = len(arr)       (also valid; mid then bisects [lo, hi))
# Pick one and stick with it.
