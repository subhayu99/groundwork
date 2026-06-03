# Operators combine values: arithmetic, comparison, and logical.

total = 3 + 4 * 2              # @sync: arith
is_big = total > 10           # @sync: compare
ok = is_big and total < 100   # @sync: logical
print(total, is_big, ok)      # @sync: print
