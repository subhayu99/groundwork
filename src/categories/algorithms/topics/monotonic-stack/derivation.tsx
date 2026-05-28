import { DerivationStep } from "@/shared/derivation/types";

export const monotonicStackSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Eight cold days. When does it warm up?",
        body: (
          <>
            <p>
              You&rsquo;re looking at a week and a day of weather forecasts. For each day someone
              asks: &ldquo;How many days until a warmer one?&rdquo; If today is 72&deg; and the
              next warmer day is the day after tomorrow, the answer is 2. If no warmer day ever
              comes, the answer is 0.
            </p>
            <p>
              Eight days isn&rsquo;t a lot. But the same question shows up on a phone weather app
              with a year of data, and on a temperature sensor logging a reading every second &mdash;
              millions of points. The shape of the answer matters.
            </p>
          </>
        ),
        actionLabel: "How would you do it?",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Stand on each day. Look right until it gets warmer.",
        body: (
          <>
            <p>
              For each day, walk forward day by day until you find one that&rsquo;s warmer. Write
              down the gap. If you reach the end without finding one, the answer is 0.
            </p>
            <p>
              It&rsquo;s honest work. It also does a lot of repeat reading. The cold morning at
              the start has to scan most of the week to find its warmer day. Eight days is fine.
              A million is not &mdash; you&rsquo;re looking at the square of the size.
            </p>
            <p>
              What&rsquo;s the repeated work we could remember?
            </p>
          </>
        ),
        actionLabel: "Remember who's still waiting",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Keep a line of days still waiting.",
        body: (
          <>
            <p>
              Walk through the days left to right, one at a time. Keep a line of days that
              haven&rsquo;t found a warmer day yet. Each day arrives and asks: &ldquo;Am I warmer
              than the last person in line?&rdquo;
            </p>
            <p>
              <strong>Yes:</strong> today is that person&rsquo;s answer. Send them home with the
              gap. Now ask again of the new last person. Keep going.
            </p>
            <p>
              <strong>No:</strong> today joins the back of the line and waits.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              Press the right-side controls to step through the days. Watch the line grow when
              today is cold and empty out when today is warm.
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
        title: "A stack of indices. Pop while today wins.",
        body: (
          <>
            <p>
              The &ldquo;line&rdquo; is a stack &mdash; we always add to and remove from the same
              end. We push <em>indices</em>, not temperatures, so we can compute the gap.
            </p>
            <p>
              For each new day <code>i</code>: while the stack isn&rsquo;t empty and today&rsquo;s
              temperature is greater than the temperature at the top index <code>j</code>, pop{" "}
              <code>j</code> and write <code>answer[j] = i - j</code>. Then push <code>i</code>.
            </p>
            <p>
              At the end, anyone still on the stack never found a warmer day. Their answer was
              already initialized to 0.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The principle:</strong> each day is pushed exactly once and popped at most
              once. The total work across the whole walk is bounded, even though a single day
              might pop a lot.
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
        title: "A few days do a lot. The average is constant.",
        body: (
          <>
            <p>
              A single warm day can pop everyone waiting &mdash; that one step might do a dozen
              pops. Looks expensive.
            </p>
            <p>
              But every pop is paid for by a push that already happened. The total pushes plus
              pops across the whole array is at most <code>2n</code> &mdash; that&rsquo;s{" "}
              <code>O(n)</code> (cost grows in step with how many days there are) total work, or{" "}
              <code>O(1) amortized</code> (instant per day on average &mdash; the rare expensive
              days are paid for by all the cheap ones) per day.
            </p>
            <p>
              That word <em>amortized</em> is the whole pitch: pay a little extra sometimes, save
              on average. The expensive steps are rare and pre-paid.
            </p>
          </>
        ),
        actionLabel: "Same trick, new questions",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "The generalization",
        title: "Anything that asks 'previous/next thing with a property'.",
        body: (
          <>
            <p>
              The stack trick isn&rsquo;t about temperatures. It works any time the question is
              &ldquo;for each item, what&rsquo;s the next (or previous) one that&rsquo;s bigger /
              smaller / warmer / taller / cheaper?&rdquo;
            </p>
            <p>
              Same idea, different stories: largest rectangle that fits under a row of bars; how
              long a stock kept rising before the price you&rsquo;re looking at; the next paint
              color that&rsquo;s lighter than the current one; daily warmest temperatures.
            </p>
            <p>
              The shape is always the same: walk once, keep a stack of things still waiting, let
              each new item answer everyone it beats.
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
        title: "Monotonic Stack.",
        body: (
          <>
            <p>
              That&rsquo;s the name. The stack is &ldquo;monotonic&rdquo; because the values inside
              it always go in one direction &mdash; here, cooler at the bottom up to colder near
              the top. The moment a new value would break that order, you pop until it holds again.
            </p>
            <p>
              <strong>Pattern signals:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>&ldquo;For each element, find the next/previous one that is bigger/smaller&rdquo;</li>
              <li>&ldquo;Days until X happens&rdquo; / &ldquo;span of consecutive smaller values&rdquo;</li>
              <li>&ldquo;Largest rectangle / max area under a row&rdquo;</li>
              <li>One pass and total work bounded by a few times the length</li>
            </ul>
            <p>
              Open the drawer below to see the Python. Each line maps to one of the rules above.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
