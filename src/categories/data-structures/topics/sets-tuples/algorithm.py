# Sets and Tuples — when membership matters and when grouping matters

# ===== Set: unordered, unique, fast membership =====

logged_in: set[str] = set()
logged_in.add("alice")          # O(1) average
logged_in.add("bob")
logged_in.add("alice")          # silently ignored — already in

print("alice" in logged_in)     # True   — O(1) average
print(len(logged_in))           # 2

logged_in.discard("bob")        # O(1), no error if missing

# Set operations are O(min(|A|, |B|)) on average.
admins = {"alice", "carol"}
both = logged_in & admins       # intersection
either = logged_in | admins     # union
only_a = logged_in - admins     # difference


# ===== Tuple: ordered, fixed-size, immutable =====

reading = ("2026-05-28", 47.5, 22.1)        # date, latitude, temperature
date, lat, temp = reading                    # unpack by position

# You cannot mutate a tuple — that's the point.
# reading[0] = "..."     ❌ TypeError

# Because tuples are immutable, they can be hash-map keys and set elements.
seen: set[tuple[float, float]] = set()
seen.add((47.5, 22.1))                       # OK — tuples hash
# seen.add([47.5, 22.1])                     ❌ lists don't hash
