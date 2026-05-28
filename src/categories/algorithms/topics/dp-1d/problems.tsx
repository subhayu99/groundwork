import type { PracticeProblem } from "@/shared/practice/types";

const houseRobber = `def house_robber(houses: list[int]) -> int:
    """Max cash from a row of houses, no two adjacent."""
    if not houses:
        return 0
    if len(houses) == 1:
        return houses[0]

    # prev2 = best from houses up to i-2; prev1 = best up to i-1.
    # Only two values are ever needed, so two scalars are enough.
    prev2 = houses[0]
    prev1 = max(houses[0], houses[1])

    for i in range(2, len(houses)):
        cur = max(prev1, prev2 + houses[i])
        prev2 = prev1
        prev1 = cur

    return prev1
`;

export const dp1dProblems: PracticeProblem[] = [
  {
    id: "house-robber",
    title: "House robber",
    difficulty: "medium",
    teaser: "Rob the most cash from a row of houses without picking two adjacent ones.",
    prompt: (
      <>
        <p>
          A street has a row of houses. Each house has some cash in it. Robbing two adjacent
          houses on the same night sets off the alarm &mdash; you can&rsquo;t do that. Return the
          <strong> most</strong> cash you can take.
        </p>
        <p>
          Each house is either robbed or skipped. No partial robberies.
        </p>
      </>
    ),
    constraints: [
      "0 ≤ len(houses) ≤ 100,000",
      "0 ≤ houses[i] ≤ 10,000",
    ],
    examples: [
      {
        input: "houses = [2, 7, 9, 3, 1]",
        output: "12",
        note: "Rob houses 0, 2, and 4: 2 + 9 + 1 = 12. (You can't take both 7 and 9.)",
      },
      {
        input: "houses = [1, 2, 3, 1]",
        output: "4",
        note: "Rob houses 0 and 2: 1 + 3 = 4. Beats houses 1 and 3, which give 3.",
      },
      {
        input: "houses = [5]",
        output: "5",
        note: "One house, take it.",
      },
    ],
    hints: [
      <p>
        Stand at house <code>i</code>. You have exactly two choices: <strong>skip</strong> it
        (then the best you can do is the same answer for the houses up to <code>i - 1</code>) or{" "}
        <strong>take</strong> it (then add <code>houses[i]</code> to the best you could do for
        the houses up to <code>i - 2</code>, because <code>i - 1</code> is now off-limits).
      </p>,
      <p>
        Define <code>best(i)</code> = the most cash takeable considering houses <code>0..i</code>.
        Then <code>best(i) = max(best(i - 1), best(i - 2) + houses[i])</code>. Recursive form
        writes itself &mdash; but naively it recomputes the same <code>best(i)</code> a lot.
      </p>,
      <p>
        Build the answers bottom-up: <code>best(0)</code>, <code>best(1)</code>, &hellip;,{" "}
        <code>best(n-1)</code>. Each one is just <code>max</code> of two earlier ones. Because
        you only ever look back two steps, you don&rsquo;t need to keep the whole table &mdash;
        two running variables (<code>prev1</code>, <code>prev2</code>) are enough.
      </p>,
    ],
    solution: houseRobber,
    solutionWalkthrough: (
      <div className="space-y-3">
        <p>
          The trick is recognising that &ldquo;best for the first <em>i</em> houses&rdquo; only
          depends on the best for <em>i-1</em> and <em>i-2</em>. So a table would have one row
          per house, but only two cells are ever live &mdash; the previous one and the one
          before that.
        </p>
        <p>
          That collapses the memory from <code>O(n)</code> down to <code>O(1)</code> while
          keeping <code>O(n)</code> time. One pass, two variables. Same shape, two flavours.
        </p>
      </div>
    ),
  },
];
