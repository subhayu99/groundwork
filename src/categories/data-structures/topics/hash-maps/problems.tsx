import type { PracticeProblem } from "@/shared/practice/types";

const twoSum = `def two_sum(nums: list[int], target: int) -> list[int]:
    """Return the indices of the two numbers that add up to target."""
    # Maps a value we've already seen -> the index it lived at.
    seen: dict[int, int] = {}

    for i, num in enumerate(nums):
        # The partner that would complete the pair with the current number.
        complement = target - num

        # If we met the partner earlier, we've found our answer.
        if complement in seen:
            return [seen[complement], i]

        # Otherwise, remember this number for a future partner.
        seen[num] = i

    return []  # No valid pair (won't happen if a solution is guaranteed).
`;

const groupAnagrams = `def group_anagrams(words: list[str]) -> list[list[str]]:
    """Group words that are anagrams of one another."""
    # Maps a canonical key (the sorted letters) -> all words sharing it.
    groups: dict[str, list[str]] = {}

    for word in words:
        # Anagrams collapse to the same key once their letters are sorted.
        key = "".join(sorted(word))

        # setdefault creates an empty list the first time we see a key.
        groups.setdefault(key, []).append(word)

    # The caller only cares about the buckets, not the keys.
    return list(groups.values())
`;

export const hashMapsProblems: PracticeProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    teaser: "Find the indices of the two numbers in a list that add up to a target.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of numbers and a <code>target</code>. Return the indices of the
          two numbers that add up to <code>target</code>. Exactly one such pair exists, and you
          may not use the same element twice.
        </p>
        <p>
          The answer can be returned in any order &mdash; <code>[0, 1]</code> and{" "}
          <code>[1, 0]</code> are equally valid.
        </p>
      </div>
    ),
    constraints: [
      "2 ≤ len(nums) ≤ 100,000",
      "Each value fits in a signed 32-bit integer",
      "Exactly one valid pair is guaranteed to exist",
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        note: "nums[0] + nums[1] = 2 + 7 = 9.",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        note: "nums[1] + nums[2] = 2 + 4 = 6; note 3 + 3 is not allowed (same index twice).",
      },
    ],
    hints: [
      <p>
        Brute force: for every index <code>i</code>, scan every later index <code>j</code> and
        check whether <code>nums[i] + nums[j] == target</code>. That&rsquo;s{" "}
        <code>O(n&sup2;)</code> comparisons. The waste is re-scanning numbers you&rsquo;ve already
        walked past.
      </p>,
      <p>
        For each number <code>num</code>, the only partner that helps is{" "}
        <code>target &minus; num</code>. So the real question is: &ldquo;have I already seen the
        partner I need?&rdquo; A hash map answers that in <code>O(1)</code>.
      </p>,
      <p>
        Make one pass. Before storing the current number, check whether its complement is already
        a key in your <code>seen</code> map. If it is, you have both indices; if not, record{" "}
        <code>seen[num] = i</code> and move on. One pass, <code>O(n)</code> time.
      </p>,
    ],
    solution: twoSum,
    solutionWalkthrough: (
      <p>
        The map lets us trade memory for speed: instead of re-scanning the list to find a partner,
        we ask the <code>seen</code> dictionary in constant time. Each element is inserted and
        looked up at most once, so the whole function runs in <code>O(n)</code> time and{" "}
        <code>O(n)</code> space &mdash; a single sweep instead of the nested loops of brute force.
      </p>
    ),
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "medium",
    teaser: "Cluster a list of words so that anagrams end up in the same group.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given a list of lowercase words. Group them so that words which are
          anagrams of each other &mdash; same letters, possibly reordered &mdash; land in the same
          sub-list. Return the list of groups.
        </p>
        <p>
          The groups may appear in any order, and the words within each group may appear in any
          order.
        </p>
      </div>
    ),
    constraints: [
      "1 ≤ len(words) ≤ 10,000",
      "0 ≤ len(word) ≤ 100",
      "Every word consists of lowercase English letters",
    ],
    examples: [
      {
        input: 'words = ["eat", "tea", "tan", "ate", "nat", "bat"]',
        output: '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]',
        note: '"eat", "tea", and "ate" share the letters a, e, t.',
      },
      {
        input: 'words = ["", "b", ""]',
        output: '[["", ""], ["b"]]',
        note: "Empty strings are anagrams of each other.",
      },
    ],
    hints: [
      <p>
        Two words are anagrams exactly when they contain the same letters with the same counts.
        The challenge is finding a single value that all anagrams of a word share &mdash; a{" "}
        <em>canonical form</em> &mdash; so you can use it to bucket them.
      </p>,
      <p>
        Sorting the letters of a word gives such a canonical form: <code>"eat"</code>,{" "}
        <code>"tea"</code>, and <code>"ate"</code> all sort to <code>"aet"</code>. Anagrams
        collide on the same sorted key; non-anagrams never do.
      </p>,
      <p>
        Use a dictionary that maps each sorted key to the list of words that produced it. Walk the
        words once, computing the key and appending with <code>setdefault</code>. At the end, the
        dictionary&rsquo;s values <em>are</em> your groups.
      </p>,
    ],
    solution: groupAnagrams,
    solutionWalkthrough: (
      <p>
        For each of the <code>n</code> words of length up to <code>L</code>, sorting costs{" "}
        <code>O(L log L)</code>, so the total work is <code>O(n &middot; L log L)</code>. The hash
        map turns the &ldquo;which group does this belong to?&rdquo; question into a constant-time
        lookup &mdash; without it we&rsquo;d be comparing every word against every existing group.
      </p>
    ),
  },
];
