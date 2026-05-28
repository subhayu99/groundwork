from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:
    value: int
    next: Optional["Node"] = None


def insert_after(node: Node, value: int) -> Node:
    """Splice a new node in after `node`. O(1) — only two pointers move."""
    new_node = Node(value=value, next=node.next)
    node.next = new_node
    return new_node


def remove_after(node: Node) -> Optional[Node]:
    """Unlink the node sitting after `node`. O(1) — one pointer reassignment."""
    removed = node.next
    if removed is None:
        return None
    node.next = removed.next
    return removed


def find(head: Optional[Node], value: int) -> Optional[Node]:
    """Walk the list looking for value. O(n) — there's no index."""
    cur = head
    while cur is not None:
        if cur.value == value:
            return cur
        cur = cur.next
    return None


# Build a tiny list: 1 -> 2 -> 3
head = Node(1, Node(2, Node(3)))
