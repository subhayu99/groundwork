import type { PracticeProblem } from "@/shared/practice/types";

const moveZeroes = `def move_zeroes(nums: list[int]) -> None:
    """Push every 0 to the end, in place, keeping the other numbers in order."""
    # 'write' marks where the next non-zero number belongs.
    write = 0

    # First pass: copy every non-zero value forward, packed tight at the front.
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write] = nums[read]
            write += 1

    # Second pass: everything from 'write' onward must be the leftover zeroes.
    for i in range(write, len(nums)):
        nums[i] = 0
`;

const maxSubarray = `def max_subarray(nums: list[int]) -> int:
    """Largest sum of any contiguous run of numbers (Kadane's algorithm)."""
    # 'best' is the answer so far; 'current' is the best run ending right here.
    best = nums[0]
    current = nums[0]

    for x in nums[1:]:
        # Either extend the run we're on, or start fresh at x — whichever is bigger.
        current = max(x, current + x)
        best = max(best, current)

    return best
`;

export const arraysProblems: PracticeProblem[] = [
  {
    id: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "easy",
    teaser: "Shift every 0 to the end of the list while keeping the other numbers in their original order.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers that may contain some <code>0</code>s. Move all the
          zeroes to the end of the list, and keep the non-zero numbers in the same relative order
          they started in.
        </p>
        <p>
          You must do this <em>in place</em> &mdash; modify the list you were handed rather than
          building and returning a new one.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
      "Modify nums in place; do not allocate a second list",
    ],
    examples: [
      {
        input: "nums = [0, 1, 0, 3, 12]",
        output: "[1, 3, 12, 0, 0]",
        note: "1, 3 and 12 keep their order; the two zeroes pile up at the end.",
      },
      {
        input: "nums = [0, 0, 5]",
        output: "[5, 0, 0]",
        note: "Only one non-zero value, so it slides to the front and the zeroes follow.",
      },
    ],
    hints: [
      <p>
        Think about the answer in two halves: a block of non-zero numbers (in their original
        order) followed by a block of zeroes. How many zeroes end up at the back? Exactly as many
        as were in the list to begin with.
      </p>,
      <p>
        Keep a <code>write</code> pointer that tracks where the next non-zero number should go.
        Walk through the list once; every time you meet a non-zero value, drop it at{" "}
        <code>write</code> and bump <code>write</code> forward. The non-zeroes naturally land
        packed and in order.
      </p>,
      <p>
        After that pass, <code>write</code> sits right where the zeroes should begin. Fill every
        slot from <code>write</code> to the end with <code>0</code>. Two quick passes, no extra
        list, total work <code>O(n)</code>.
      </p>,
    ],
    solution: moveZeroes,
    solutionWalkthrough: (
      <p>
        The first loop compacts all non-zero values toward the front using a single{" "}
        <code>write</code> cursor, preserving their order. When it finishes, <code>write</code>{" "}
        equals the count of non-zero values, so every index from <code>write</code> onward is
        leftover space &mdash; we simply overwrite it with zeroes. Each element is touched a
        constant number of times, giving <code>O(n)</code> time and <code>O(1)</code> extra space.
      </p>
    ),
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "medium",
    teaser: "Find the largest sum you can get from a contiguous run of numbers in the list.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers (positive, negative, or zero). Find the contiguous
          run &mdash; one or more numbers next to each other &mdash; with the largest possible sum,
          and return that sum.
        </p>
        <p>
          The run must contain at least one number, so even when every value is negative you still
          have to pick something.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
      "The chosen run must be non-empty and contiguous",
    ],
    examples: [
      {
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        note: "The run [4, -1, 2, 1] sums to 6, which beats every other contiguous run.",
      },
      {
        input: "nums = [-3, -1, -2]",
        output: "-1",
        note: "Every number is negative, so the best single-element run is [-1].",
      },
    ],
    hints: [
      <p>
        Trying every possible run &mdash; every start and every end &mdash; and summing each is{" "}
        <code>O(n&sup2;)</code> or worse. There&rsquo;s a one-pass way that decides the answer as
        it goes.
      </p>,
      <p>
        Sweep left to right and ask one question at each number <code>x</code>: should the best run
        that <em>ends here</em> extend the run from the previous step, or is the previous run such
        a drag that I&rsquo;m better off starting over at <code>x</code> alone? Take whichever is
        larger: <code>max(x, current + x)</code>.
      </p>,
      <p>
        That rolling value is the best run ending at the current spot. Keep a separate{" "}
        <code>best</code> that remembers the largest such value you&rsquo;ve ever seen. Seeding
        both with <code>nums[0]</code> handles the all-negative case for free. One pass,{" "}
        <code>O(n)</code> time, <code>O(1)</code> space &mdash; this is Kadane&rsquo;s algorithm.
      </p>,
    ],
    solution: maxSubarray,
    solutionWalkthrough: (
      <p>
        <code>current</code> always holds the maximum sum of a run that ends at the number we&rsquo;re
        looking at. At each step we either glue <code>x</code> onto that run or abandon it and
        restart from <code>x</code> &mdash; whichever yields more. Because a negative{" "}
        <code>current</code> can only hurt, restarting is exactly the right move when the prefix
        turns sour. <code>best</code> trails along recording the high-water mark. Both start at{" "}
        <code>nums[0]</code> so a list of all-negative numbers still returns its largest (least
        negative) element. The whole thing is a single <code>O(n)</code> pass.
      </p>
    ),
  },
];
