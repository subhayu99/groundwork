import type { PracticeProblem } from "@/shared/practice/types";

const validParentheses = `def is_valid(s: str) -> bool:
    """Return True if every bracket in s is closed by the right
    kind of bracket, in the right order."""
    # Each closer maps to the opener it must match.
    closer_to_opener = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []

    for ch in s:
        if ch in closer_to_opener:
            # A closer is only valid if it matches the most recent
            # still-open bracket sitting on top of the stack.
            if not stack or stack.pop() != closer_to_opener[ch]:
                return False
        else:
            # An opener just waits on the stack for its partner.
            stack.append(ch)

    # Valid only if nothing was left waiting to be closed.
    return not stack
`;

const minStack = `class MinStack:
    """A stack with push/pop/top and getMin all in O(1).

    Trick: alongside the real stack, keep a second stack whose top
    always holds the minimum of everything currently below it.
    """

    def __init__(self) -> None:
        self._stack: list[int] = []
        # Mirrors the main stack; _mins[-1] is the running minimum.
        self._mins: list[int] = []

    def push(self, val: int) -> None:
        self._stack.append(val)
        # The new minimum is val or the previous minimum, whichever is smaller.
        current_min = val if not self._mins else min(val, self._mins[-1])
        self._mins.append(current_min)

    def pop(self) -> None:
        # Pop both stacks together so their tops stay in lockstep.
        self._stack.pop()
        self._mins.pop()

    def top(self) -> int:
        return self._stack[-1]

    def getMin(self) -> int:
        # The current minimum is always sitting on top of the min stack.
        return self._mins[-1]
`;

export const stacksQueuesProblems: PracticeProblem[] = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    teaser:
      "Decide whether a string of brackets is balanced and correctly nested.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a string <code>s</code> containing only the
          characters <code>(</code>, <code>)</code>, <code>[</code>,{" "}
          <code>]</code>, <code>{"{"}</code> and <code>{"}"}</code>. Decide
          whether the brackets are valid.
        </p>
        <p>
          A string is valid when every opening bracket is closed by a bracket of
          the same type, and brackets close in the correct order &mdash; the
          most recently opened bracket must be the first one closed.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(s) ≤ 10,000",
      "s consists only of the characters ()[]{}",
    ],
    examples: [
      {
        input: 's = "([]{})"',
        output: "true",
        note: "Every bracket is closed in the reverse order it was opened.",
      },
      {
        input: 's = "(]"',
        output: "false",
        note: "The ( is closed by a ], which is the wrong type.",
      },
    ],
    hints: [
      <p>
        The rule &ldquo;the most recently opened bracket is the first to
        close&rdquo; is exactly last-in, first-out. That&rsquo;s the signature of
        a <code>stack</code>.
      </p>,
      <p>
        Walk through the string. When you see an opener, push it. When you see a
        closer, the only bracket it&rsquo;s allowed to match is whatever&rsquo;s
        on <code>top</code> of the stack right now.
      </p>,
      <p>
        Two ways to fail: a closer arrives when the stack is empty (nothing to
        match), or it matches the wrong opener. And if anything is still on the
        stack at the end, those openers were never closed &mdash; also invalid.
      </p>,
    ],
    solution: validParentheses,
    solutionWalkthrough: (
      <p>
        Each character is pushed at most once and popped at most once, so the
        work is <code>O(n)</code> for a string of length <code>n</code>. The
        stack holds at most every unmatched opener, so extra space is{" "}
        <code>O(n)</code> in the worst case (a string of all openers).
      </p>
    ),
  },
  {
    id: "min-stack",
    title: "Min Stack",
    difficulty: "medium",
    teaser:
      "Design a stack that also reports its smallest element in constant time.",
    prompt: (
      <div className="space-y-3">
        <p>
          Design a stack that supports four operations, each running in{" "}
          <code>O(1)</code> time:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <code>push(val)</code> &mdash; add <code>val</code> to the top.
          </li>
          <li>
            <code>pop()</code> &mdash; remove the top element.
          </li>
          <li>
            <code>top()</code> &mdash; read the top element.
          </li>
          <li>
            <code>getMin()</code> &mdash; return the smallest element currently
            in the stack.
          </li>
        </ul>
        <p>
          The catch is <code>getMin</code>: scanning the whole stack would be{" "}
          <code>O(n)</code>, but the requirement is constant time.
        </p>
      </div>
    ),
    constraints: [
      "Each value fits in a signed 32-bit integer",
      "pop, top and getMin are only called on a non-empty stack",
      "At most 30,000 operations in total",
    ],
    examples: [
      {
        input:
          "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()",
        output: "-3, then 0, then -2",
        note: "getMin returns -3, pop removes -3, top reads 0, getMin now returns -2.",
      },
    ],
    hints: [
      <p>
        You can&rsquo;t recompute the minimum on every <code>getMin</code> call.
        Instead, store it &mdash; remember the minimum as the stack changes
        rather than searching for it.
      </p>,
      <p>
        Keep a second &ldquo;min stack&rdquo; that grows and shrinks in lockstep
        with the main one. Its top should always equal the minimum of everything
        currently in the main stack.
      </p>,
      <p>
        On <code>push(val)</code>, push <code>min(val, current_min)</code> onto
        the min stack. On <code>pop</code>, pop both. Then <code>getMin</code> is
        just reading the top of the min stack &mdash; <code>O(1)</code>.
      </p>,
    ],
    solution: minStack,
    solutionWalkthrough: (
      <p>
        Every operation touches only the tops of two lists, so each is{" "}
        <code>O(1)</code>. The auxiliary min stack mirrors the main one, doubling
        memory to <code>O(n)</code> &mdash; a deliberate trade of space for the
        constant-time <code>getMin</code> the problem demands.
      </p>
    ),
  },
];
