import { DerivationStep } from "@/shared/derivation/types";

export const activitySelectionSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "One room. Seven people want it. Fit the most.",
        body: (
          <>
            <p>
              You have one meeting room and a stack of booking requests. Each one is a start time
              and an end time. Two meetings can&rsquo;t overlap &mdash; if one ends at 11 and the
              next starts at 11, that&rsquo;s fine; 10:30 to 11:30 next to 11:00 to 12:00 is not.
            </p>
            <p>
              You can&rsquo;t make everybody happy. The question is: <strong>how do you fit as
              many meetings as possible</strong> into that one room?
            </p>
          </>
        ),
        actionLabel: "How would you decide?",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Try every combination. Or pick a quick rule that's wrong.",
        body: (
          <>
            <p>
              The careful answer: try every possible subset of meetings, drop the overlapping ones,
              keep the biggest non-overlapping set. With seven meetings that&rsquo;s 128 subsets
              &mdash; doable. With thirty, it&rsquo;s a billion. Off the table.
            </p>
            <p>
              So you reach for a quick rule. <em>Shortest meeting first?</em> Sounds smart &mdash;
              short meetings free the room fast. But the shortest meeting might sit right in the
              middle of the day and block both morning and afternoon. Wrong rule.
            </p>
            <p>
              <em>Earliest start first?</em> The 8am meeting that runs all day blocks everything
              else. Also wrong.
            </p>
            <p>
              What about a rule based on <strong>when each meeting frees the room</strong>?
            </p>
          </>
        ),
        actionLabel: "Try ending earliest",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Sort by end time. Always pick the one that ends soonest.",
        body: (
          <>
            <p>
              On the right is the day, laid out on a timeline. Press <em>sort by end</em>. The
              meetings rearrange so the one that finishes earliest sits on top.
            </p>
            <p>
              Now press <em>play</em>. We walk down the list. We accept a meeting if it starts on
              or after the last one we accepted ended. Otherwise we skip it.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The intuition: the room is free at the earliest possible moment. That can only help.
              Any later choice leaves the room busy longer and rules out more of what&rsquo;s next.
            </div>
          </>
        ),
        actionLabel: "Press play and watch",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The derivation",
        title: "Sort once. Walk once. Track when the room is free.",
        body: (
          <>
            <p>
              The whole algorithm fits in five lines.
            </p>
            <p>
              <strong>1.</strong> Sort the meetings by end time. <strong>2.</strong> Keep a
              variable <code>last_end</code> for when the room is next free. <strong>3.</strong>
              Walk the sorted list. <strong>4.</strong> If the meeting starts at or after{" "}
              <code>last_end</code>, accept it and update <code>last_end</code> to its end.{" "}
              <strong>5.</strong> Otherwise, skip it.
            </p>
            <p>
              Why is this best? Suppose someone else picks a different meeting first. We can swap
              ours in &mdash; ours ends sooner or at the same time, so anything that fit after
              theirs also fits after ours. The swap never loses a meeting. So the locally best
              choice is at least as good as any other choice.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> the locally best choice (free the room first) is
              never worse than any other choice. So greed wins.
            </div>
          </>
        ),
        actionLabel: "Count the work",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Sort once. Then one pass.",
        body: (
          <>
            <p>
              <strong>Sort by end time:</strong> <code>O(n log n)</code> (cost grows slowly with
              size &mdash; a thousand meetings takes about ten thousand small comparisons).
            </p>
            <p>
              <strong>Walk through:</strong> <code>O(n)</code> (cost grows in step with how many
              meetings there are) &mdash; one quick check per meeting.
            </p>
            <p>
              Memory: just one running variable (<code>last_end</code>) and the list of accepted
              meetings. No extra structure. The sort is the only expensive part.
            </p>
          </>
        ),
        actionLabel: "Same shape, new problems",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Greedy works when the swap argument holds.",
        body: (
          <>
            <p>
              Greedy means: at each step, take the locally best choice and never look back. It
              works whenever you can argue: &ldquo;if anyone else made a different choice first, I
              could swap mine in without losing.&rdquo;
            </p>
            <p>
              Same shape, different stories: scheduling jobs on a single machine, picking the most
              non-overlapping intervals on a timeline, fitting talks into a single conference
              track, choosing the maximum set of non-conflicting tasks.
            </p>
            <p>
              When greedy fails: making change for 30 cents with coins worth 1, 12, and 25 &mdash;
              greedy grabs a 25 and gets stuck on 5 ones. Better answer: two 12s and a 6&hellip;
              wait, there&rsquo;s no 6. You&rsquo;d need to step back and try other combinations.
              That&rsquo;s when you reach for dynamic programming. Greedy only wins when no
              backtracking is ever needed.
            </p>
          </>
        ),
        actionLabel: "Name the pattern",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The pattern",
        title: "Greedy.",
        body: (
          <>
            <p>
              That&rsquo;s the name. The hard part isn&rsquo;t the code &mdash; it&rsquo;s knowing
              greedy is allowed. The test is the swap argument: if the locally best choice is
              never worse than any other choice, you can stop second-guessing.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Fit the most non-overlapping things into one slot&rdquo;</li>
              <li>&ldquo;Minimum number of X to cover all Y&rdquo; on intervals or a sorted axis</li>
              <li>&ldquo;Pick the cheapest available edge / job / coin&rdquo; with a local-best
              criterion</li>
              <li>Anywhere the locally best choice provably can&rsquo;t block the global best</li>
            </ul>
            <p>
              Open the drawer below to see the Python. Five lines of real work; one line of sort.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
