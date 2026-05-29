import type { PracticeProblem } from "@/shared/practice/types";

const fibonacci = `def fib(n: int) -> int:
    """The n-th Fibonacci number, defined straight from its math."""
    # Base case: the recursion has to stop somewhere.
    # The first two numbers are given to us — no smaller problem to solve.
    if n < 2:
        return n

    # Recursive case: each number is the sum of the two before it.
    # We trust fib to solve the two strictly-smaller subproblems.
    return fib(n - 1) + fib(n - 2)
`;

const powXN = `def my_pow(x: float, n: int) -> float:
    """Compute x ** n by halving the exponent each step."""
    # Negative exponent: x ** -n is just 1 / (x ** n).
    # Flip the sign and the base, then fall through to the positive case.
    if n < 0:
        return my_pow(1 / x, -n)

    # Base case: anything to the power 0 is 1. This stops the recursion.
    if n == 0:
        return 1.0

    # Solve the half-sized subproblem ONCE, then reuse it.
    half = my_pow(x, n // 2)

    # Even exponent: x ** n == (x ** (n // 2)) ** 2.
    # Odd exponent: there's one leftover factor of x to multiply back in.
    if n % 2 == 0:
        return half * half
    return half * half * x
`;

export const recursionProblems: PracticeProblem[] = [
  {
    id: "fibonacci-number",
    title: "Fibonacci Number",
    difficulty: "easy",
    teaser: "Return the n-th number in the Fibonacci sequence.",
    prompt: (
      <div className="space-y-3">
        <p>
          The Fibonacci sequence starts <code>0, 1</code> and then every number
          after that is the sum of the two before it. So the sequence goes{" "}
          <code>0, 1, 1, 2, 3, 5, 8, 13, &hellip;</code>
        </p>
        <p>
          Given an integer <code>n</code>, return <code>fib(n)</code>, where{" "}
          <code>fib(0) = 0</code>, <code>fib(1) = 1</code>, and{" "}
          <code>fib(n) = fib(n - 1) + fib(n - 2)</code> for <code>n &ge; 2</code>.
        </p>
      </div>
    ),
    constraints: ["0 ≤ n ≤ 30"],
    examples: [
      {
        input: "n = 2",
        output: "1",
        note: "fib(2) = fib(1) + fib(0) = 1 + 0 = 1.",
      },
      {
        input: "n = 5",
        output: "5",
        note: "The sequence is 0, 1, 1, 2, 3, 5 — the entry at index 5 is 5.",
      },
    ],
    hints: [
      <p>
        The problem statement <em>is</em> the recursion. The hard part of any
        recursive solution is spotting the <strong>base case</strong> &mdash; the
        smallest input you can answer outright. Here <code>fib(0)</code> and{" "}
        <code>fib(1)</code> are given to you with no further work.
      </p>,
      <p>
        For every other <code>n</code>, don&rsquo;t try to compute the whole
        sequence yourself. Just trust that <code>fib</code> already knows how to
        solve the two <em>smaller</em> problems &mdash; <code>fib(n - 1)</code> and{" "}
        <code>fib(n - 2)</code> &mdash; and add their answers together.
      </p>,
      <p>
        Plain recursion recomputes the same values over and over: asking for{" "}
        <code>fib(5)</code> evaluates <code>fib(2)</code> three separate times.
        Once you have it working, try <strong>memoization</strong> &mdash; cache each
        result (e.g. with <code>functools.lru_cache</code> or a dict) so every{" "}
        <code>fib(k)</code> is computed only once.
      </p>,
    ],
    solution: fibonacci,
    solutionWalkthrough: (
      <p>
        The function answers the two base cases <code>n &lt; 2</code> directly,
        and otherwise reduces to two strictly-smaller calls whose results it sums.
        As written it is <code>O(2&#8319;)</code> because subproblems repeat;
        wrapping it in a memoization cache collapses that to <code>O(n)</code> by
        computing each <code>fib(k)</code> exactly once.
      </p>
    ),
  },
  {
    id: "pow-x-n",
    title: "Pow(x, n)",
    difficulty: "medium",
    teaser: "Compute x raised to the power n without the built-in operator.",
    prompt: (
      <div className="space-y-3">
        <p>
          Implement <code>pow(x, n)</code>, which raises a floating-point number{" "}
          <code>x</code> to the integer power <code>n</code> (that is,{" "}
          <code>x&#8319;</code>).
        </p>
        <p>
          The exponent <code>n</code> can be negative, in which case{" "}
          <code>x&#8315;&#8319; = 1 / x&#8319;</code>. Do it without calling the
          built-in exponentiation operator.
        </p>
      </div>
    ),
    constraints: [
      "-100 ≤ n ≤ 100",
      "-100.0 < x < 100.0",
      "x is not 0 when n is negative",
    ],
    examples: [
      {
        input: "x = 2.0, n = 10",
        output: "1024.0",
        note: "2 multiplied by itself ten times.",
      },
      {
        input: "x = 2.0, n = -2",
        output: "0.25",
        note: "Negative power: 2 ** -2 = 1 / (2 ** 2) = 1 / 4.",
      },
    ],
    hints: [
      <p>
        Handle the sign first. A negative exponent is the same problem on a
        flipped base: <code>my_pow(x, -n)</code> equals{" "}
        <code>my_pow(1 / x, n)</code>. Convert once at the top so the rest of the
        function only ever deals with a non-negative <code>n</code>.
      </p>,
      <p>
        The naive loop multiplies <code>x</code> by itself <code>n</code> times &mdash;{" "}
        <code>O(n)</code>. But <code>x&#8319;</code> can be built from a much
        smaller piece: <code>x&#8319; = (x&#8319;&#7488;&#7506;) &times; (x&#8319;&#7488;&#7506;)</code>{" "}
        when <code>n</code> is even. Halving the exponent is the smaller
        subproblem.
      </p>,
      <p>
        Compute <code>half = my_pow(x, n // 2)</code> just <strong>once</strong> and
        square it. If <code>n</code> is odd, integer division dropped a factor of{" "}
        <code>x</code>, so multiply one extra <code>x</code> back in. The base case{" "}
        <code>n == 0</code> returns <code>1</code> and stops the recursion. Each
        call halves <code>n</code>, giving <code>O(log n)</code> multiplications.
      </p>,
    ],
    solution: powXN,
    solutionWalkthrough: (
      <p>
        Negative exponents are normalized away first, leaving a clean recursion on
        non-negative <code>n</code>. The base case <code>n == 0</code> returns{" "}
        <code>1</code>. Every other call solves <em>one</em> half-sized subproblem
        and squares it &mdash; with a stray factor of <code>x</code> reintroduced
        when <code>n</code> is odd. Because <code>n</code> halves at each level, the
        recursion depth is <code>O(log n)</code>, far cheaper than multiplying{" "}
        <code>n</code> times.
      </p>
    ),
  },
];
