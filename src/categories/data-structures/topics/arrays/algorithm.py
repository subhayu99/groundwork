# Arrays / Python lists — the operations you actually use

books: list[str] = ["Atlas", "Brave", "Calm", "Dust", "Echo"]

# 1. Indexed access — O(1). Jump straight to position i.
third = books[2]            # "Calm"

# 2. Append at the end — O(1) amortized.
books.append("Frame")       # ["Atlas", ..., "Echo", "Frame"]

# 3. Insert in the middle — O(n). Everything after shifts right.
books.insert(2, "Bridge")   # everything from index 2 onward moves +1

# 4. Delete at index — O(n). Everything after shifts left.
del books[1]                # everything from index 1 onward moves -1

# 5. Iterate — O(n).
for i, title in enumerate(books):
    print(i, title)

# 6. Length — O(1). Always tracked.
n = len(books)
