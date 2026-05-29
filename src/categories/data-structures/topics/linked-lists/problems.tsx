import type { PracticeProblem } from "@/shared/practice/types";

const reverseLinkedList = `class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def reverse_list(head: ListNode | None) -> ListNode | None:
    """Reverse a singly linked list in place and return the new head."""
    prev = None
    cur = head

    while cur is not None:
        # Remember where we were heading before we rewire.
        nxt = cur.next
        # Flip this node's arrow to point backwards.
        cur.next = prev
        # Walk both pointers one step forward.
        prev = cur
        cur = nxt

    # prev now sits on the old tail, which is the new head.
    return prev
`;

const linkedListCycle = `class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def has_cycle(head: ListNode | None) -> bool:
    """Return True if the linked list loops back on itself."""
    slow = head
    fast = head

    # Fast moves two steps, slow moves one. If there's a loop,
    # fast laps slow and they collide. If not, fast hits the end.
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True

    return False
`;

export const linkedListsProblems: PracticeProblem[] = [
  {
    id: "reverse-linked-list",
    title: "Reverse a Linked List",
    difficulty: "easy",
    teaser: "Flip a singly linked list so the last node becomes the first.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given the <code>head</code> of a singly linked list, where each node holds a
          value and a <code>next</code> pointer to the following node. Reverse the list so that the
          old tail becomes the new <code>head</code>, and return that new head.
        </p>
        <p>
          Do it in place &mdash; rewire the existing <code>next</code> pointers rather than building
          a fresh list. The list may also be empty.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 5,000",
      "Each node value fits in a signed 32-bit integer",
      "Solve it in O(1) extra space",
    ],
    examples: [
      {
        input: "head = 1 -> 2 -> 3 -> 4 -> 5",
        output: "5 -> 4 -> 3 -> 2 -> 1",
        note: "Every arrow now points the other way; node 5 is the head.",
      },
      {
        input: "head = None",
        output: "None",
        note: "An empty list reverses to an empty list.",
      },
    ],
    hints: [
      <p>
        The trouble with reversing is that once you flip a node&rsquo;s <code>next</code> arrow to
        point backwards, you&rsquo;ve lost the link to the rest of the list. So before rewiring any
        node, stash where it was about to go.
      </p>,
      <p>
        Walk the list with two pointers: <code>prev</code> trails behind (starting at{" "}
        <code>None</code>) and <code>cur</code> is the node you&rsquo;re currently flipping. For
        each node, save <code>cur.next</code> in a temporary <code>nxt</code> first.
      </p>,
      <p>
        The loop body is four lines: <code>nxt = cur.next</code>, then{" "}
        <code>cur.next = prev</code>, then advance <code>prev = cur</code> and{" "}
        <code>cur = nxt</code>. When <code>cur</code> falls off the end, <code>prev</code> is sitting
        on the new head &mdash; return it.
      </p>,
    ],
    solution: reverseLinkedList,
    solutionWalkthrough: (
      <p>
        We touch each node exactly once, doing a constant amount of pointer shuffling per node, so
        the work is <code>O(n)</code> for a list of <code>n</code> nodes. We only ever keep three
        pointers around &mdash; <code>prev</code>, <code>cur</code>, and <code>nxt</code> &mdash; so
        the extra space is <code>O(1)</code>.
      </p>
    ),
  },
  {
    id: "linked-list-cycle",
    title: "Linked List Cycle",
    difficulty: "medium",
    teaser: "Decide whether a linked list loops back on itself or ends cleanly.",
    prompt: (
      <div className="space-y-3">
        <p>
          You&rsquo;re given the <code>head</code> of a singly linked list. Somewhere in it, a
          node&rsquo;s <code>next</code> pointer might point back to an earlier node, forming a loop.
          Return <code>True</code> if such a cycle exists and <code>False</code> otherwise.
        </p>
        <p>
          Aim for <code>O(1)</code> extra memory &mdash; no set of visited nodes. The list can be
          empty.
        </p>
      </div>
    ),
    constraints: [
      "0 ≤ number of nodes ≤ 10,000",
      "Each node value fits in a signed 32-bit integer",
      "Solve it in O(1) extra space",
    ],
    examples: [
      {
        input: "3 -> 2 -> 0 -> -4, where -4 points back to 2",
        output: "True",
        note: "Following next forever, you keep circling 2 -> 0 -> -4 -> 2.",
      },
      {
        input: "1 -> 2",
        output: "False",
        note: "The list ends at 2; next is None, so there's no loop.",
      },
    ],
    hints: [
      <p>
        The obvious approach is to remember every node you&rsquo;ve seen in a set and flag a repeat.
        That works, but it costs <code>O(n)</code> extra memory. There&rsquo;s a way to do it with
        just two pointers and no extra storage.
      </p>,
      <p>
        Send two pointers through the list at different speeds: <code>slow</code> takes one step at
        a time, <code>fast</code> takes two. If the list ends, <code>fast</code> reaches{" "}
        <code>None</code> first &mdash; no cycle. If there&rsquo;s a loop, both pointers get trapped
        inside it.
      </p>,
      <p>
        Inside a loop, the gap between <code>fast</code> and <code>slow</code> closes by one node on
        every step, so <code>fast</code> is guaranteed to land on <code>slow</code> eventually. When{" "}
        <code>slow is fast</code>, you&rsquo;ve found the cycle. This is Floyd&rsquo;s
        tortoise-and-hare trick.
      </p>,
    ],
    solution: linkedListCycle,
    solutionWalkthrough: (
      <p>
        If there&rsquo;s no cycle, <code>fast</code> reaches the end in about <code>n / 2</code>{" "}
        steps. If there is one, both pointers enter the loop and <code>fast</code> catches{" "}
        <code>slow</code> within one full lap of it, so the total work stays <code>O(n)</code>. We
        only hold two pointers, giving <code>O(1)</code> extra space &mdash; no visited set needed.
      </p>
    ),
  },
];
