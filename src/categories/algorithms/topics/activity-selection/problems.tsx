import type { PracticeProblem } from "@/shared/practice/types";

const canAttendMeetings = `def can_attend_all_meetings(intervals: list[list[int]]) -> bool:
    """Return True if no two meetings overlap in time."""
    # Sort by start time so meetings line up in chronological order.
    intervals.sort(key=lambda meeting: meeting[0])

    # Walk neighbours: if one starts before the previous ends, they clash.
    for prev, curr in zip(intervals, intervals[1:]):
        if curr[0] < prev[1]:
            return False

    return True
`;

const eraseOverlapIntervals = `def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    """Fewest intervals to drop so the survivors never overlap."""
    if not intervals:
        return 0

    # Greedy: always keep the interval that finishes earliest.
    # Sorting by end time leaves the most room for what comes after.
    intervals.sort(key=lambda interval: interval[1])

    removed = 0
    prev_end = intervals[0][1]

    for start, end in intervals[1:]:
        if start < prev_end:
            # Overlaps the last survivor — drop this one, keep the earlier finisher.
            removed += 1
        else:
            # No clash: this interval becomes the new boundary.
            prev_end = end

    return removed
`;

export const activitySelectionProblems: PracticeProblem[] = [
  {
    id: "can-attend-all-meetings",
    title: "Can attend all meetings",
    difficulty: "easy",
    teaser: "Given meeting time intervals, decide whether you could attend every one of them.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of meetings, each written as{" "}
          <code>[start, end]</code>. Return <code>True</code> if you could attend{" "}
          <em>all</em> of them &mdash; that is, no two meetings overlap in time &mdash; and{" "}
          <code>False</code> otherwise.
        </p>
        <p>
          A meeting that ends exactly when another begins (touching at a single point) does{" "}
          <em>not</em> count as an overlap; you can walk straight from one into the next.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ len(intervals) ≤ 10,000",
      "intervals[i] = [start, end] with start < end",
      "0 ≤ start < end ≤ 1,000,000",
    ],
    examples: [
      {
        input: "intervals = [[0, 30], [5, 10], [15, 20]]",
        output: "False",
        note: "The 5–10 meeting falls inside the 0–30 meeting, so you can't make both.",
      },
      {
        input: "intervals = [[7, 10], [2, 4]]",
        output: "True",
        note: "After sorting, 2–4 ends before 7–10 begins — no clash.",
      },
    ],
    hints: [
      <p>
        Two meetings clash when one starts before the other has finished. Comparing every pair
        is <code>O(n&sup2;)</code>; we&rsquo;d rather only compare meetings that are actually
        next to each other in time.
      </p>,
      <p>
        Sort the meetings by their <code>start</code> time. Once they&rsquo;re in chronological
        order, a clash can only happen between <em>adjacent</em> meetings &mdash; if a meeting
        doesn&rsquo;t overlap its immediate neighbour, it can&rsquo;t overlap anything further
        along either.
      </p>,
      <p>
        Walk the sorted list once. For each pair of neighbours, the later one&rsquo;s{" "}
        <code>start</code> must be at least the earlier one&rsquo;s <code>end</code>. The first
        time <code>curr[0] &lt; prev[1]</code>, return <code>False</code>; survive the whole pass
        and the answer is <code>True</code>.
      </p>,
    ],
    solution: canAttendMeetings,
    solutionWalkthrough: (
      <p>
        Sorting dominates the cost at <code>O(n log n)</code>; the single neighbour-checking pass
        is <code>O(n)</code>. We only ever compare adjacent meetings because sorting guarantees
        that a non-overlapping neighbour rules out every later meeting too.
      </p>
    ),
  },
  {
    id: "non-overlapping-intervals",
    title: "Non-overlapping intervals",
    difficulty: "medium",
    teaser: "Remove the fewest intervals so that the ones left behind never overlap.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of intervals <code>[start, end]</code>. Return the{" "}
          <em>minimum</em> number of intervals you must remove so that the remaining intervals
          don&rsquo;t overlap each other.
        </p>
        <p>
          As before, intervals that merely touch at an endpoint (one ends where the next begins)
          are <em>not</em> considered overlapping and may both stay.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(intervals) ≤ 100,000",
      "intervals[i] = [start, end] with start < end",
      "-1,000,000 ≤ start < end ≤ 1,000,000",
    ],
    examples: [
      {
        input: "intervals = [[1, 2], [2, 3], [3, 4], [1, 3]]",
        output: "1",
        note: "Drop [1, 3] and the remaining three intervals sit side by side without overlap.",
      },
      {
        input: "intervals = [[1, 2], [1, 2], [1, 2]]",
        output: "2",
        note: "Three identical intervals all clash; keep one, remove the other two.",
      },
    ],
    hints: [
      <p>
        Removing the fewest intervals is the same as <em>keeping</em> the most. So this is really
        the classic activity-selection problem in disguise: pick the largest set of intervals
        that don&rsquo;t overlap, then everything else is what you remove.
      </p>,
      <p>
        The greedy insight: among intervals competing for the same slot, always keep the one that{" "}
        <strong>finishes earliest</strong>. An earlier finish leaves the most room for whatever
        comes next, so it can never hurt to prefer it. That means sorting by <code>end</code>{" "}
        time, not start time.
      </p>,
      <p>
        After sorting by <code>end</code>, sweep left to right tracking <code>prev_end</code>, the
        finish time of the last interval you kept. If the next interval&rsquo;s <code>start</code>{" "}
        is below <code>prev_end</code> it overlaps &mdash; count a removal and keep your earlier
        finisher. Otherwise accept it and advance <code>prev_end</code>.
      </p>,
    ],
    solution: eraseOverlapIntervals,
    solutionWalkthrough: (
      <p>
        Sorting by end time is <code>O(n log n)</code> and the greedy sweep is <code>O(n)</code>.
        Keeping the earliest-finishing interval at each clash is provably optimal: any optimal
        solution can be rewritten to use the earliest finisher without keeping fewer intervals, so
        the greedy choice maximises survivors &mdash; and therefore minimises removals.
      </p>
    ),
  },
];
