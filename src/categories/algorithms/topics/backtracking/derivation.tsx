import { DerivationStep } from "@/shared/derivation/types";

export const backtrackingSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Six queens. Six rows. Nobody attacks anybody.",
        body: (
          <>
            <p>
              You have a 6&times;6 chessboard and six queens. The job: place all six so that{" "}
              <strong>no two of them attack each other</strong>. Queens move in straight lines and
              diagonally as far as they want. So no two queens can share a row, a column, or a
              diagonal.
            </p>
            <p>
              At a glance you can see it&rsquo;s possible &mdash; but you can also see it&rsquo;s
              tight. Every queen you place rules out a lot of the board for the next one.
            </p>
          </>
        ),
        actionLabel: "How would you search?",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Try every placement. The numbers explode.",
        body: (
          <>
            <p>
              Brute force: try every way to pick 6 squares out of 36, check if the placement is
              legal, count the wins. That&rsquo;s in the millions of combinations &mdash; doable
              but wasteful.
            </p>
            <p>
              Notice though: queens can&rsquo;t share a row, so each row gets exactly one. The
              real choice is &ldquo;which column on each row.&rdquo; That&rsquo;s 6 picks of 6
              columns &mdash; <code>6<sup>6</sup> = 46,656</code> placements to check. Better.
              Still wasteful.
            </p>
            <p>
              The real waste isn&rsquo;t the count of total placements. It&rsquo;s how many of
              them <em>could never work</em>. The moment you place the first queen in column 0,
              every placement with a second queen in column 0 is dead on arrival. Why even start
              building them?
            </p>
          </>
        ),
        actionLabel: "Stop building dead branches",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Build a partial answer. Check as you go. Undo when stuck.",
        body: (
          <>
            <p>
              On the right is the board. Place a queen in row 0 wherever you like. The squares
              it attacks light up. Now move to row 1 &mdash; you can only place a queen on a
              square the row-0 queen doesn&rsquo;t attack.
            </p>
            <p>
              Keep going. The moment you find a row with <em>no</em> safe square left, the partial
              board you&rsquo;ve built is a dead end. Undo the last placement and try a different
              square in that row instead.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              The wedge: don&rsquo;t finish a partial answer before checking it&rsquo;s still
              possible. Check at each step. Quit the branch the moment it can&rsquo;t reach a
              solution.
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
        title: "Place row by row. Recurse. Undo on dead end.",
        body: (
          <>
            <p>
              Write <code>place(placed)</code>, where <code>placed</code> is a list of columns,
              one per row already filled.
            </p>
            <p>
              <strong>Base case.</strong> If <code>placed</code> has <code>n</code> entries, the
              board is full. Record this solution and return.
            </p>
            <p>
              <strong>Recursive case.</strong> The next row is <code>len(placed)</code>. For each
              column 0 to <code>n-1</code>: if a queen there wouldn&rsquo;t share a column or
              diagonal with any queen already placed, push that column, recurse, then{" "}
              <strong>pop</strong> &mdash; that&rsquo;s the &ldquo;undo&rdquo; that lets us try
              the next column.
            </p>
            <p>
              The pop is the heart of the algorithm. Without it, the function would keep growing
              the placed list and never explore alternatives.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> <em>search-space pruning</em>. Every time we reject
              a column, we skip every partial board that would have started with it &mdash; an
              entire subtree of placements we never even build.
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
        title: "Worst case is still huge. In practice we cut deep.",
        body: (
          <>
            <p>
              Without the safety check we&rsquo;d build <code>n<sup>n</sup></code> placements
              &mdash; for n=6 that&rsquo;s 46,656. With the check, the search visits a tiny
              fraction. For n=6 we touch hundreds of partial boards, not tens of thousands.
            </p>
            <p>
              The worst-case math is still exponential &mdash; there are problems where the prune
              barely fires. But for N-queens the prune is dramatic. For sudoku it&rsquo;s even
              more dramatic. The whole technique is to <em>fail early</em>.
            </p>
            <p>
              <strong>Memory:</strong> the call stack is at most <code>n</code> deep &mdash; one
              frame per row. We carry one list of length <code>n</code>. That&rsquo;s it.
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
        title: "Anywhere you build an answer piece-by-piece with a check.",
        body: (
          <>
            <p>
              The N-queens problem isn&rsquo;t about chess. It&rsquo;s about: build an answer one
              choice at a time, and as soon as a partial answer becomes impossible, abandon every
              continuation of it.
            </p>
            <p>
              Same shape, different stories: sudoku, crosswords, graph coloring, parsing source
              code with a grammar, generating all valid parenthesisations, all subsets that sum
              to a target, all word ladders of a certain length, all routes a knight can take on
              an empty board.
            </p>
            <p>
              The check at each step is what separates this from blind search. The better the
              check, the bigger the prune, the faster the algorithm.
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
        title: "Backtracking.",
        body: (
          <>
            <p>
              That&rsquo;s the name. It&rsquo;s depth-first search with a constraint check at
              each step. The <em>back</em> in backtracking is the undo &mdash; the recursion pops
              its frame and the caller tries its next option.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;Find all / count all&rdquo; arrangements that satisfy a constraint</li>
              <li>&ldquo;Is there any&rdquo; assignment that satisfies a constraint</li>
              <li>You can describe a partial answer and tell mid-way whether it&rsquo;s still
              feasible</li>
              <li>The answer is built up by a sequence of choices, not by a closed-form rule</li>
            </ul>
            <p>
              Open the drawer for the Python. The safety check is the engine. The recursion
              writes itself.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
