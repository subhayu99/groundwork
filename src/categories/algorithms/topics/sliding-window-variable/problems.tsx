import type { PracticeProblem } from "@/shared/practice/types";

const longestUniqueSubstring = `def length_of_longest_substring(s: str) -> int:
    """Length of the longest substring with no repeated characters."""
    # last_seen[c] = the most recent index where character c appeared.
    last_seen: dict[str, int] = {}
    start = 0  # left edge of the current no-repeat window
    best = 0

    for end, ch in enumerate(s):
        # If we've seen ch inside the current window, jump the left edge
        # just past that earlier copy so the window stays repeat-free.
        if ch in last_seen and last_seen[ch] >= start:
            start = last_seen[ch] + 1

        # Record (or refresh) where we last saw this character.
        last_seen[ch] = end

        # The window is s[start:end+1]; track the widest one.
        best = max(best, end - start + 1)

    return best
`;

const minSubarraySum = `def min_subarray_len(target: int, nums: list[int]) -> int:
    """Length of the shortest contiguous run whose sum is >= target.

    Returns 0 when no run reaches the target.
    """
    start = 0       # left edge of the current window
    window = 0      # sum of nums[start:end+1]
    best = len(nums) + 1  # sentinel: bigger than any real answer

    for end, value in enumerate(nums):
        # Grow the window to the right.
        window += value

        # As long as we already clear the target, shrink from the left
        # to see how small the window can get while staying valid.
        while window >= target:
            best = min(best, end - start + 1)
            window -= nums[start]
            start += 1

    # If best never moved, nothing summed to the target.
    return best if best <= len(nums) else 0
`;

export const slidingWindowVariableProblems: PracticeProblem[] = [
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    teaser:
      "Find the length of the longest stretch of a string that contains no repeated character.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a string <code>s</code>. Return the length of the longest{" "}
          <em>substring</em> (a run of consecutive characters) in which no character appears
          twice.
        </p>
        <p>
          The window can be any width &mdash; unlike a fixed-size window, here you decide how far
          it grows. The moment a repeat sneaks in, the window has to give ground on the left.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ len(s) ≤ 50,000",
      "s consists of letters, digits, symbols, and spaces",
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        note: 'The answer is "abc", with length 3. After that a repeated "a" forces a shrink.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        note: 'Every character repeats, so the best you can hold is a single "b".',
      },
    ],
    hints: [
      <p>
        Picture a window <code>s[start:end]</code> that you promise contains no repeats. Walk{" "}
        <code>end</code> forward one character at a time and ask: does adding this character break
        the promise?
      </p>,
      <p>
        To answer that instantly, remember <em>where</em> you last saw each character in a{" "}
        <code>last_seen</code> map. If the new character was last seen <strong>inside</strong> the
        current window (index <code>&ge; start</code>), you have a repeat.
      </p>,
      <p>
        On a repeat, don&rsquo;t shrink one step at a time &mdash; jump <code>start</code> straight
        to <code>last_seen[ch] + 1</code>, just past the old copy. Each character is visited once
        as <code>end</code> and the left edge only moves forward, so the whole thing is{" "}
        <code>O(n)</code>.
      </p>,
    ],
    solution: longestUniqueSubstring,
    solutionWalkthrough: (
      <p>
        <code>end</code> sweeps the string once, and <code>start</code> never moves backward, so
        across the entire run the left edge advances at most <code>n</code> times. That&rsquo;s{" "}
        <code>O(n)</code> time with an <code>O(min(n, alphabet))</code> map &mdash; the &ldquo;jump
        the left edge&rdquo; trick is what keeps it linear instead of quadratic.
      </p>
    ),
  },
  {
    id: "minimum-size-subarray-sum",
    title: "Minimum Size Subarray Sum",
    difficulty: "medium",
    teaser:
      "Find the shortest contiguous block of positive numbers whose sum reaches a target.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given an array of positive integers <code>nums</code> and a positive{" "}
          <code>target</code>. Return the length of the <strong>shortest</strong> contiguous
          subarray whose sum is at least <code>target</code>.
        </p>
        <p>
          If no subarray adds up to <code>target</code>, return <code>0</code>. Because every
          number is positive, adding to the window only grows the sum and removing only shrinks it
          &mdash; that monotonic behaviour is the whole trick.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ target ≤ 1,000,000,000",
      "1 ≤ len(nums) ≤ 100,000",
      "1 ≤ nums[i] ≤ 10,000 (all values are positive)",
    ],
    examples: [
      {
        input: "target = 7, nums = [2, 3, 1, 2, 4, 3]",
        output: "2",
        note: "The subarray [4, 3] sums to 7 and is the shortest that reaches the target.",
      },
      {
        input: "target = 11, nums = [1, 1, 1, 1, 1, 1, 1]",
        output: "0",
        note: "The total is only 7, so no subarray can ever reach 11.",
      },
    ],
    hints: [
      <p>
        Try a window <code>nums[start:end]</code> and keep its running <code>sum</code>. Push{" "}
        <code>end</code> rightward, adding each new value, until the window&rsquo;s sum finally
        reaches <code>target</code>.
      </p>,
      <p>
        Once the window is &ldquo;valid&rdquo; (sum <code>&ge; target</code>), it might be longer
        than it needs to be. Since all numbers are positive, you can safely peel values off the{" "}
        <strong>left</strong> &mdash; each removal shrinks the sum &mdash; recording the length each
        time it&rsquo;s still valid.
      </p>,
      <p>
        Keep shrinking while the window stays valid, then resume growing on the right. Both{" "}
        <code>start</code> and <code>end</code> only ever move forward, so each element is added
        once and removed at most once: <code>O(n)</code> overall.
      </p>,
    ],
    solution: minSubarraySum,
    solutionWalkthrough: (
      <p>
        <code>end</code> makes a single left-to-right pass adding values, and the inner{" "}
        <code>while</code> only advances <code>start</code> &mdash; never rewinds it. So even
        though there&rsquo;s a loop inside a loop, every index is added once and dropped once,
        giving <code>O(n)</code> time and <code>O(1)</code> space. The sentinel <code>best</code>{" "}
        cleanly distinguishes &ldquo;never reached the target&rdquo; from a real answer.
      </p>
    ),
  },
];
