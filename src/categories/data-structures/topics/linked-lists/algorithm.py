from dataclasses import dataclass
from typing import Optional


@dataclass
class Node:  # @sync: node_class
    value: int  # @sync: node_value
    next: Optional["Node"] = None  # @sync: node_next


def insert_after(node: Node, value: int) -> Node:  # @sync: sig
    """Splice a new node in after `node`. O(1) — only two pointers move."""
    new_node = Node(value=value, next=node.next)  # @sync: insert_new
    node.next = new_node  # @sync: insert_relink
    return new_node


def remove_after(node: Node) -> Optional[Node]:
    """Unlink the node sitting after `node`. O(1) — one pointer reassignment."""
    removed = node.next
    if removed is None:
        return None
    node.next = removed.next  # @sync: remove_relink
    return removed


def find(head: Optional[Node], value: int) -> Optional[Node]:
    """Walk the list looking for value. O(n) — there's no index."""
    cur = head  # @sync: traverse_init
    while cur is not None:  # @sync: traverse_loop
        if cur.value == value:
            return cur
        cur = cur.next  # @sync: traverse_advance
    return None


# Build a tiny list: 1 -> 2 -> 3
head = Node(1, Node(2, Node(3)))
