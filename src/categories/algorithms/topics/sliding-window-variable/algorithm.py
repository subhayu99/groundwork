def longest_unique_substring(s: str) -> int:
    """Length of the longest substring of s with no repeated characters.

    Variable sliding window:
      - right grows whenever adding s[right] keeps the window valid
      - left shrinks just enough to restore the invariant when a
        repeat shows up
    """
    last_seen: dict[str, int] = {}   # char -> most recent index
    left = 0
    best = 0

    for right, ch in enumerate(s):
        # If we've seen ch inside the current window, jump left
        # past its previous occurrence so the window stays unique.
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1

        last_seen[ch] = right
        best = max(best, right - left + 1)

    return best


# Same template, different invariant:
#
#   right expands whenever the window can grow without breaking the invariant.
#   left shrinks the minimum amount needed to restore the invariant.
#
# Every character enters once and leaves once -> overall O(n).
