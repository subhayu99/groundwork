def fixed_window_sums(arr: list[int], k: int) -> list[int]:
    """Sum of every contiguous window of size k.

    Sliding window: maintain the running sum, slide one step at a time,
    pay only two operations per slide (subtract leaver, add newcomer).
    """
    if k > len(arr):
        return []

    window_sum = sum(arr[:k])
    results = [window_sum]

    for i in range(k, len(arr)):
        window_sum = window_sum - arr[i - k] + arr[i]
        results.append(window_sum)

    return results
