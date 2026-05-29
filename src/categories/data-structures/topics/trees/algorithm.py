from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TreeNode:
    value: int  # @sync: node_class
    children: list["TreeNode"] = field(default_factory=list)


# Traverse: visit every node, with parents before children (pre-order).
def dfs(node: TreeNode) -> list[int]:
    out = [node.value]                # visit current node @sync: dfs_visit
    for child in node.children:       # @sync: dfs_children
        out.extend(dfs(child))        # recurse into each child @sync: dfs_recurse
    return out


# Binary Search Tree: smaller on the left, larger on the right.
@dataclass
class BSTNode:
    value: int  # @sync: bst_class
    left:  Optional["BSTNode"] = None
    right: Optional["BSTNode"] = None


def bst_insert(root: Optional[BSTNode], v: int) -> BSTNode:
    if root is None:                          # @sync: bst_insert_empty
        return BSTNode(v)                     # @sync: bst_insert_new
    if v < root.value:                        # @sync: bst_insert_left
        root.left = bst_insert(root.left, v)
    elif v > root.value:                      # @sync: bst_insert_right
        root.right = bst_insert(root.right, v)
    return root


def bst_contains(root: Optional[BSTNode], v: int) -> bool:
    cur = root                                       # @sync: bst_start
    while cur is not None:                           # @sync: bst_loop
        if v == cur.value:                           # @sync: bst_eq
            return True
        cur = cur.left if v < cur.value else cur.right  # go left/right @sync: bst_left, bst_right
    return False
