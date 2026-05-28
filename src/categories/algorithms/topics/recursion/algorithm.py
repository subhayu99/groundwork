def folder_size(node: dict) -> int:
    """Total bytes inside a folder, counting every file at every depth.

    A node is either a file (with a size) or a folder (with children).
    The size of a folder is the sum of the sizes of its children.
    That last sentence is the whole algorithm — we just write it down
    in code, and let the function call itself on each child.
    """
    # Base case: a file knows its own size. Stop recursing.
    if node["type"] == "file":
        return node["size"]

    # Recursive case: a folder is the sum of its children's sizes.
    # Each child is a smaller version of the same problem.
    return sum(folder_size(child) for child in node["children"])


# Two pieces are non-negotiable in every recursive function:
#   1. A base case that doesn't recurse — the recursion has to stop.
#   2. A recursive case that calls the function on something STRICTLY
#      SMALLER than what came in (a file inside the folder, never the
#      folder itself).
# Skip either piece and you either get a wrong answer or a stack
# overflow.
