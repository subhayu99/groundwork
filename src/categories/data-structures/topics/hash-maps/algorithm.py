# Hash maps — find a value by COMPUTING where it lives, not scanning

# ===== Under the hood: a hash function picks a bucket =====
# A hash map keeps a row of "buckets". A hash turns the key into a
# bucket number, so we jump straight to it instead of scanning every
# entry — that is why look-up is O(1) on average, not O(n).

class HashMap:
    def __init__(self, capacity: int = 16) -> None:
        self.capacity = capacity
        self.buckets: list[list] = [[] for _ in range(capacity)]  # @sync: hm_buckets

    def _slot(self, key: str) -> int:
        return hash(key) % self.capacity      # @sync: hm_slot

    def put(self, key: str, value: str) -> None:
        bucket = self.buckets[self._slot(key)]  # @sync: hm_put_slot
        for i, (k, _) in enumerate(bucket):     # already in this bucket? @sync: hm_put_scan
            if k == key:
                bucket[i] = (key, value)        # overwrite @sync: hm_put_overwrite
                return
        bucket.append((key, value))             # new key — chain it @sync: hm_put_append

    def get(self, key: str) -> str:
        bucket = self.buckets[self._slot(key)]  # @sync: hm_get_slot
        for k, v in bucket:                     # walk only this one bucket @sync: hm_get_scan
            if k == key:
                return v                        # @sync: hm_get_found
        raise KeyError(key)


# ===== In practice: just use dict — it IS a hash map =====
phone: dict[str, str] = {}      # @sync: dict_init
phone["alice"] = "+1-555-0102"  # @sync: insert
phone["bob"]   = "+1-555-0118"
phone["cara"]  = "+1-555-0144"

alices_number = phone["alice"]  # one hop, O(1) average @sync: lookup

if "dan" in phone:              # @sync: membership
    print("found")

del phone["bob"]                # @sync: delete

for name, number in phone.items():  # @sync: iterate
    print(name, number)
