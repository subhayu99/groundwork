from collections import defaultdict, deque

# A graph is just "who is connected to whom?" — usually stored as
# an adjacency list: a dict mapping each node to its neighbors.

friends: dict[str, list[str]] = defaultdict(list)


def add_edge(a: str, b: str) -> None:
    """Undirected edge — friendship goes both ways."""
    friends[a].append(b)
    friends[b].append(a)


add_edge("alice", "bob")
add_edge("alice", "cara")
add_edge("bob",   "dan")
add_edge("cara",  "eli")
add_edge("dan",   "fawn")


# Breadth-first search: visit closer-by friends before farther-by ones.
# This finds shortest paths in unweighted graphs.
def bfs(start: str) -> list[str]:
    seen: set[str] = {start}
    queue: deque[str] = deque([start])
    order: list[str] = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in friends[node]:
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append(neighbor)
    return order


# Depth-first search: dive into a path until it dead-ends, then backtrack.
def dfs(start: str) -> list[str]:
    seen: set[str] = set()
    order: list[str] = []

    def visit(node: str) -> None:
        if node in seen:
            return
        seen.add(node)
        order.append(node)
        for neighbor in friends[node]:
            visit(neighbor)

    visit(start)
    return order
