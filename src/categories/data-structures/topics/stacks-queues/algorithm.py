# Stacks (LIFO) and Queues (FIFO) — restricted-access sequences

# ===== Stack: last in, first out =====
# A plain list is already a stack: append and pop both touch the same end.

history: list[str] = []
history.append("home")       # push   — O(1)
history.append("inbox")      # push   — O(1)
history.append("invoice")    # push   — O(1)
last = history.pop()         # "invoice" — O(1)
peek = history[-1]           # "inbox" without removing — O(1)


# ===== Queue: first in, first out =====
# Don't use list.pop(0) — it's O(n) because every element shifts left.
# Use collections.deque, which has O(1) on both ends.
from collections import deque

orders: deque[str] = deque()
orders.append("latte")       # enqueue — O(1)
orders.append("mocha")       # enqueue — O(1)
orders.append("americano")   # enqueue — O(1)
first = orders.popleft()     # "latte" — O(1)
