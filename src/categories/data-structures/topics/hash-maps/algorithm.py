# Hash maps — Python dicts are hash maps under the hood

# 1. Insert / overwrite — O(1) average.
phone: dict[str, str] = {}
phone["alice"] = "+1-555-0102"
phone["bob"]   = "+1-555-0118"
phone["cara"]  = "+1-555-0144"

# 2. Look up by key — O(1) average. No scan; the key tells us where to look.
alices_number = phone["alice"]

# 3. Membership check — O(1) average.
if "dan" in phone:
    print("found")

# 4. Delete — O(1) average.
del phone["bob"]

# 5. Iterate — O(n). No order guarantee in Python < 3.7;
# insertion order is preserved from Python 3.7 onward.
for name, number in phone.items():
    print(name, number)


# The mental model — what a hash map does internally:
#
#   bucket_index = hash(key) % capacity
#   table[bucket_index].append((key, value))
#
# `hash` scatters keys uniformly across buckets so on average each
# bucket has ~1 item, and look-up is one address computation.
