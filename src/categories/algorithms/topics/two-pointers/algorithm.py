def two_sum_sorted(arr: list[int], target: int) -> tuple[int, int] | None:  # @sync: sig
    """Find a pair of indices whose values sum to target.

    Assumes arr is sorted ascending. Walks two pointers from each end,
    shrinking the search space by one position per step.
    """
    left = 0                          # @sync: init
    right = len(arr) - 1              # @sync: init_right

    while left < right:               # @sync: loop
        s = arr[left] + arr[right]    # @sync: compute
        if s == target:               # @sync: compare
            return (left, right)      # @sync: found
        if s < target:                # @sync: less
            left += 1                 # move left pointer inward @sync: move_left
        else:                         # @sync: greater
            right -= 1                # move right pointer inward @sync: move_right

    return None                       # @sync: notfound
