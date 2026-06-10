def binary_search(arr: list[int], target: int) -> int:  # @sync: sig
    """Find the index of target in a sorted array, or -1 if absent.

    Each comparison eliminates half of the remaining search space.
    """
    lo = 0                            # @sync: init
    hi = len(arr) - 1

    while lo <= hi:                   # @sync: loop
        mid = (lo + hi) // 2          # midpoint; integer division @sync: mid
        if arr[mid] == target:        # @sync: compare
            return mid                # @sync: found
        if arr[mid] < target:         # @sync: less
            lo = mid + 1               # answer is in the right half @sync: lo_update
        else:                         # @sync: greater
            hi = mid - 1               # answer is in the left half @sync: hi_update

    return -1                         # @sync: notfound


# Off-by-one is the gotcha. Two correct conventions:
#   1. lo <= hi  with hi = len(arr) - 1   (this version)
#   2. lo <  hi  with hi = len(arr)       (half-open [lo, hi); also valid)
# In convention 2 the go-left step also changes: hi = mid, NOT mid - 1
# (mid is already excluded, so don't subtract). Pick one and stick with it.
