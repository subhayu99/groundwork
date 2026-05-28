from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TreeNode:
    value: int
    children: list["TreeNode"] = field(default_factory=list)


# Traverse: visit every node, with parents before children (pre-order).
def dfs(node: TreeNode) -> list[int]:
    out = [node.value]
    for child in node.children:
        out.extend(dfs(child))
    return out


# Binary Search Tree: smaller on the left, larger on the right.
@dataclass
class BSTNode:
    value: int
    left:  Optional["BSTNode"] = None
    right: Optional["BSTNode"] = None


def bst_insert(root: Optional[BSTNode], v: int) -> BSTNode:
    if root is None:
        return BSTNode(v)
    if v < root.value:
        root.left = bst_insert(root.left, v)
    elif v > root.value:
        root.right = bst_insert(root.right, v)
    return root


def bst_contains(root: Optional[BSTNode], v: int) -> bool:
    cur = root
    while cur is not None:
        if v == cur.value:
            return True
        cur = cur.left if v < cur.value else cur.right
    return False
