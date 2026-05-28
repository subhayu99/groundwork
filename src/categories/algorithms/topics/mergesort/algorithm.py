def mergesort(nums: list[int]) -> list[int]:
    """Sort a list by splitting it in half, sorting each half, and merging.

    The split halves are smaller versions of the same problem.
    Mergesort calls itself on each half, then merges the two sorted
    answers back into one.
    """
    # Base case: a list of length 0 or 1 is already sorted.
    if len(nums) <= 1:
        return nums

    mid = len(nums) // 2
    left = mergesort(nums[:mid])
    right = mergesort(nums[mid:])

    return merge(left, right)


def merge(left: list[int], right: list[int]) -> list[int]:
    """Combine two already-sorted lists into one sorted list.

    Walk both lists with two fingers. Whichever finger points at the
    smaller value gets added to the output and moves forward. When
    one side is empty, drop the rest of the other side in.
    """
    out: list[int] = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1

    # One of these slices is empty; the other has the tail.
    out.extend(left[i:])
    out.extend(right[j:])
    return out


# The whole structure is "split, sort each half, merge":
#   - Split is one cut: O(1) thinking, O(n) copying.
#   - Sort each half is two recursive calls on lists half the size.
#   - Merge walks both halves once: O(n) per level.
# There are log2(n) levels of splitting before we hit base cases,
# and each level does O(n) merging total — so O(n log n) overall.
