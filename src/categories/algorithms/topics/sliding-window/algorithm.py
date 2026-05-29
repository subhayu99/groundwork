def fixed_window_sums(arr: list[int], k: int) -> list[int]:  # @sync: sig
    """Sum of every contiguous window of size k.

    Sliding window: maintain the running sum, slide one step at a time,
    pay only two operations per slide (subtract leaver, add newcomer).
    """
    if k > len(arr):
        return []

    window_sum = sum(arr[:k])  # @sync: init_window
    results = [window_sum]  # @sync: init_results

    for i in range(k, len(arr)):  # @sync: loop
        window_sum = window_sum - arr[i - k] + arr[i]  # subtract leaver, add newcomer @sync: slide
        results.append(window_sum)  # @sync: record

    return results  # @sync: result
