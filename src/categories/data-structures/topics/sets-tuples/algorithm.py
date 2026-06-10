# Sets and Tuples — when membership matters and when grouping matters

# ===== Set: unordered, unique, fast membership =====

logged_in: set[str] = set()     # @sync: set_def
logged_in.add("alice")          # O(1) average @sync: set_add
logged_in.add("bob")
logged_in.add("alice")          # silently ignored — already in @sync: set_add_dup

print("alice" in logged_in)     # True   — O(1) average @sync: set_in
print(len(logged_in))           # 2

logged_in.discard("bob")        # O(1), no error if missing @sync: set_discard

# Set op costs differ: intersection O(min(|A|, |B|)),
# union O(|A| + |B|), difference O(|A|) — on average.
admins = {"alice", "carol"}
both = logged_in & admins       # intersection — O(min(|A|, |B|)) @sync: set_ops
either = logged_in | admins     # union — O(|A| + |B|)
only_a = logged_in - admins     # difference — O(|A|)


# ===== Tuple: ordered, fixed-size, immutable =====

reading = ("2026-05-28", 47.5, 22.1)        # date, latitude, temperature @sync: tuple_def
date, lat, temp = reading                    # unpack by position @sync: tuple_unpack

# You cannot mutate a tuple — that's the point.
try:
    reading[0] = 99                          # attempt to change a slot @sync: tuple_immutable
except TypeError:
    pass                                     # tuples refuse — that's the point

# Because tuples are immutable, they can be hash-map keys and set elements.
seen: set[tuple[float, float]] = set()       # @sync: tuple_seen
seen.add((47.5, 22.1))                       # OK — tuples hash @sync: tuple_key
# seen.add([47.5, 22.1])                     ❌ lists don't hash
