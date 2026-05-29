import type { PracticeProblem } from "@/shared/practice/types";

const validAnagram = `def is_anagram(s: str, t: str) -> bool:
    """True if t is a rearrangement of the exact same letters in s."""
    # Different lengths can never use the same letters the same number of times.
    if len(s) != len(t):
        return False

    # Tally how many times each character shows up in s.
    counts: dict[str, int] = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1

    # Spend those tallies on t. If we ever overspend, it's not an anagram.
    for ch in t:
        if counts.get(ch, 0) == 0:
            return False
        counts[ch] -= 1

    # Equal lengths plus no overspending means every count landed back at zero.
    return True
`;

const firstUniqueChar = `def first_uniq_char(s: str) -> int:
    """Index of the first non-repeating character, or -1 if there isn't one."""
    # First pass: count how many times each character appears.
    counts: dict[str, int] = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1

    # Second pass: the first character with a count of 1 wins.
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i

    # Every character repeated, so there is no unique one.
    return -1
`;

export const stringsProblems: PracticeProblem[] = [
  {
    id: "valid-anagram",
    title: "Valid anagram",
    difficulty: "easy",
    teaser: "Decide whether two strings use the same letters the same number of times.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given two strings, <code>s</code> and <code>t</code>. Return{" "}
          <code>True</code> if <code>t</code> is an <em>anagram</em> of <code>s</code> &mdash;
          meaning you can rearrange the letters of one to spell the other exactly.
        </p>
        <p>
          An anagram uses every letter the same number of times. So <code>&quot;listen&quot;</code>{" "}
          and <code>&quot;silent&quot;</code> match, but <code>&quot;rat&quot;</code> and{" "}
          <code>&quot;car&quot;</code> do not.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(s), len(t) ≤ 50,000",
      "Both strings contain lowercase English letters only",
    ],
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: "True",
        note: "Same multiset of letters: three a&rsquo;s, one n, one g, one r, one m.",
      },
      {
        input: 's = "rat", t = "car"',
        output: "False",
        note: "The letter t is in s but not in t, and c is in t but not in s.",
      },
    ],
    hints: [
      <p>
        If the two strings have different lengths, they can&rsquo;t possibly be anagrams &mdash;
        bail out immediately with <code>False</code> before doing any other work.
      </p>,
      <p>
        Order doesn&rsquo;t matter, only <em>how many of each letter</em> appears. Walk through{" "}
        <code>s</code> and build a tally: <code>counts[ch]</code> tells you how often each
        character shows up.
      </p>,
      <p>
        Now walk through <code>t</code> and subtract from those tallies. If you ever reach for a
        letter that&rsquo;s already at zero, <code>t</code> has a letter <code>s</code> can&rsquo;t
        afford &mdash; not an anagram. Survive the whole pass and you have a match in{" "}
        <code>O(n)</code> time.
      </p>,
    ],
    solution: validAnagram,
    solutionWalkthrough: (
      <p>
        One pass over <code>s</code> builds the counts and one pass over <code>t</code> spends
        them, so the work is <code>O(n)</code>. The length check up front handles the easy
        rejections, and because the lengths are equal, no leftover positive counts can hide &mdash;
        surviving the second pass guarantees a perfect match.
      </p>
    ),
  },
  {
    id: "first-unique-character",
    title: "First unique character in a string",
    difficulty: "medium",
    teaser: "Return the index of the first character that never repeats, or -1 if none do.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a string <code>s</code>. Find the first character that appears exactly
          once and return its index. If every character repeats, return <code>-1</code>.
        </p>
        <p>
          &ldquo;First&rdquo; means earliest position in the string &mdash; so scan left to right
          and report the index of the first letter that turns out to be unique.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(s) ≤ 100,000",
      "s contains lowercase English letters only",
    ],
    examples: [
      {
        input: 's = "leetcode"',
        output: "0",
        note: "The l at index 0 never appears again, so it&rsquo;s the first unique character.",
      },
      {
        input: 's = "aabb"',
        output: "-1",
        note: "Every character repeats, so there is no unique one.",
      },
    ],
    hints: [
      <p>
        You can&rsquo;t know whether the first character is unique until you&rsquo;ve seen the{" "}
        <em>whole</em> string &mdash; a later copy might be lurking at the end. So one pass alone
        isn&rsquo;t enough to decide as you go.
      </p>,
      <p>
        Make a first pass just to count occurrences: <code>counts[ch]</code> for every character.
        Now you know each letter&rsquo;s frequency before judging any position.
      </p>,
      <p>
        Make a second pass in order. The first index <code>i</code> where{" "}
        <code>counts[s[i]] == 1</code> is your answer. If the loop finishes without finding one,
        return <code>-1</code>. Two passes means <code>O(n)</code> overall.
      </p>,
    ],
    solution: firstUniqueChar,
    solutionWalkthrough: (
      <p>
        The trick is separating <em>counting</em> from <em>deciding</em>. The first pass tallies
        every character in <code>O(n)</code>; the second pass scans left to right and returns the
        earliest index whose count is <code>1</code>. Because the second pass preserves the
        original order, the very first unique character it meets is guaranteed to be the answer.
      </p>
    ),
  },
];
