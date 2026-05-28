def two_sum_sorted(arr: list[int], target: int) -> tuple[int, int] | None:
    """Find a pair of indices whose values sum to target.

    Assumes arr is sorted ascending. Walks two pointers from each end,
    shrinking the search space by one position per step.
    """
    left = 0
    right = len(arr) - 1

    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return (left, right)
        if s < target:
            left += 1
        else:
            right -= 1

    return None
