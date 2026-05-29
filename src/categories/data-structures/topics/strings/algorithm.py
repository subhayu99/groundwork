# Strings — an array of characters with text-friendly operations

s = "the quick brown fox"     # @sync: source

# 1. Indexed access — O(1).
first = s[0]                  # 't' @sync: index_read

# 2. Length — O(1).
n = len(s)                    # 19 @sync: length

# 3. Slicing — O(k) where k is the slice length. Returns a new string.
word = s[4:9]                 # "quick" @sync: slice

# 4. Concatenation — O(n + m). Returns a new string (immutable).
hello = "hi " + s             # "hi the quick brown fox" @sync: concat

# 5. Searching for a substring — O(n * m) naive, O(n + m) with KMP.
i = s.find("brown")           # 10, or -1 if absent @sync: find

# 6. Cannot mutate in place — s[0] = "T" raises TypeError.
# Build a new string instead:
caps = s.upper()              # "THE QUICK BROWN FOX" @sync: rebuild
