import type { PracticeProblem } from "@/shared/practice/types";

const nextGreaterElement = `def next_greater_element(nums: list[int]) -> list[int]:
    """For each value, the next strictly greater value to its right (else -1)."""
    answer = [-1] * len(nums)

    # Stack holds indices whose "next greater" is still unknown.
    # The values at these indices are strictly decreasing top-to-bottom.
    stack: list[int] = []

    for i, value in enumerate(nums):
        # Current value resolves every smaller pending index on the stack.
        while stack and nums[stack[-1]] < value:
            answer[stack[-1]] = value
            stack.pop()
        # This index now waits for its own greater value.
        stack.append(i)

    # Indices left on the stack never found anyone bigger -> already -1.
    return answer
`;

const dailyTemperatures = `def daily_temperatures(temps: list[int]) -> list[int]:
    """For each day, how many days until a strictly warmer one (else 0)."""
    answer = [0] * len(temps)

    # Stack holds indices of days still waiting for a warmer day.
    # Their temperatures are non-increasing top-to-bottom.
    stack: list[int] = []

    for day, temp in enumerate(temps):
        # Today is warmer than the pending days on top -> resolve them.
        while stack and temps[stack[-1]] < temp:
            prev = stack.pop()
            answer[prev] = day - prev
        stack.append(day)

    # Days left on the stack never warmed up -> stay 0.
    return answer
`;

export const monotonicStackProblems: PracticeProblem[] = [
  {
    id: "next-greater-element",
    title: "Next greater element",
    difficulty: "easy",
    teaser: "For each number, find the next strictly greater number to its right.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers. For every position, find the first number to its{" "}
          <em>right</em> that is strictly greater than it. Return those answers in a new list.
        </p>
        <p>
          If no number to the right is greater, the answer for that position is{" "}
          <code>-1</code>.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
    ],
    examples: [
      {
        input: "nums = [2, 1, 3, 1]",
        output: "[3, 3, -1, -1]",
        note: "Both 2 and 1 see 3 next; the trailing 3 and 1 have nothing larger ahead.",
      },
      {
        input: "nums = [5, 4, 3, 2]",
        output: "[-1, -1, -1, -1]",
        note: "Strictly decreasing — nobody ever sees a bigger number on its right.",
      },
    ],
    hints: [
      <p>
        Brute force: for each index <code>i</code>, scan rightward until you hit something
        bigger. In the worst case (a decreasing list) every scan runs to the end, giving{" "}
        <code>O(n&sup2;)</code> work. We&rsquo;d like one pass instead.
      </p>,
      <p>
        Notice that once you find a value, it answers <em>everyone</em> still waiting who is
        smaller than it. So keep a stack of indices whose answer isn&rsquo;t known yet, and keep
        that stack&rsquo;s values strictly decreasing &mdash; the moment a bigger value arrives,
        it clears off all the smaller ones at once.
      </p>,
      <p>
        Walk left to right. For each new value, pop every stacked index whose value is smaller
        and record the new value as their answer. Then push the current index. Each index is
        pushed and popped at most once, so the whole thing is <code>O(n)</code>.
      </p>,
    ],
    solution: nextGreaterElement,
    solutionWalkthrough: (
      <p>
        The stack only ever holds indices still searching for a greater value, and their values
        stay strictly decreasing. A new value resolves &mdash; and removes &mdash; every smaller
        pending index in one sweep. Because each index enters and leaves the stack exactly once,
        the total work is <code>O(n)</code> with <code>O(n)</code> extra space.
      </p>
    ),
  },
  {
    id: "daily-temperatures",
    title: "Daily temperatures",
    difficulty: "medium",
    teaser: "For each day, count how many days you wait for a warmer temperature.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list <code>temps</code> of daily temperatures. For each day,
          figure out how many days you have to wait until a <em>strictly warmer</em> day.
        </p>
        <p>
          If no warmer day ever comes, the answer for that day is <code>0</code>.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(temps) ≤ 100,000",
      "30 ≤ temps[i] ≤ 100",
    ],
    examples: [
      {
        input: "temps = [73, 74, 75, 71, 76]",
        output: "[1, 1, 2, 1, 0]",
        note: "Day 2 (75) waits 2 days for 76; the last day never warms up.",
      },
      {
        input: "temps = [80, 79, 78]",
        output: "[0, 0, 0]",
        note: "Temperatures only fall — no day has a warmer day ahead.",
      },
    ],
    hints: [
      <p>
        Brute force: for each day, scan forward until you find a warmer one. A long cold streak
        makes every scan run far, so this is <code>O(n&sup2;)</code>. We want a single pass.
      </p>,
      <p>
        The day you&rsquo;re looking at can be the &ldquo;warmer day&rdquo; for several earlier
        days at once. Keep a stack of day-indices that are still waiting, with their temperatures
        non-increasing top-to-bottom &mdash; a warm day clears all the cooler pending days
        beneath it.
      </p>,
      <p>
        Iterate left to right. While the current temperature beats the temperature at the top of
        the stack, pop that day and set its answer to the gap in indices{" "}
        (<code>today &minus; that_day</code>). Then push today. Each day is pushed and popped once,
        so the total cost is <code>O(n)</code>.
      </p>,
    ],
    solution: dailyTemperatures,
    solutionWalkthrough: (
      <p>
        The stack tracks days still awaiting a warmer day, kept non-increasing in temperature.
        When a warmer day arrives it pops each cooler pending day and records the distance{" "}
        <code>day &minus; prev</code>. Days never warmed up stay <code>0</code>. Every index is
        pushed and popped at most once, so the algorithm runs in <code>O(n)</code> time and{" "}
        <code>O(n)</code> space.
      </p>
    ),
  },
];
