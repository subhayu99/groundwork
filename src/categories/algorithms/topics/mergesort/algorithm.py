def mergesort(nums: list[int]) -> list[int]:  # @sync: sig
    """Sort a list by splitting it in half, sorting each half, and merging.

    The split halves are smaller versions of the same problem.
    Mergesort calls itself on each half, then merges the two sorted
    answers back into one.
    """
    # Base case: a list of length 0 or 1 is already sorted.
    if len(nums) <= 1:                 # @sync: base
        return nums

    mid = len(nums) // 2               # @sync: split
    left = mergesort(nums[:mid])       # @sync: recurse_left
    right = mergesort(nums[mid:])      # @sync: recurse_right

    return merge(left, right)          # @sync: merge_call


def merge(left: list[int], right: list[int]) -> list[int]:
    """Combine two already-sorted lists into one sorted list.

    Walk both lists with two fingers. Whichever finger points at the
    smaller value gets added to the output and moves forward. When
    one side is empty, drop the rest of the other side in.
    """
    out: list[int] = []
    i = j = 0

    while i < len(left) and j < len(right):  # @sync: merge_loop
        if left[i] <= right[j]:              # @sync: merge_compare
            out.append(left[i])             # @sync: merge_take
            i += 1
        else:
            out.append(right[j])
            j += 1

    # One of these slices is empty; the other has the tail.
    out.extend(left[i:])               # @sync: merge_tail
    out.extend(right[j:])
    return out


# The whole structure is "split, sort each half, merge":
#   - Split is one cut: O(1) thinking, O(n) copying.
#   - Sort each half is two recursive calls on lists half the size.
#   - Merge walks both halves once: O(n) per level.
# There are log2(n) levels of splitting before we hit base cases,
# and each level does O(n) merging total — so O(n log n) overall.
