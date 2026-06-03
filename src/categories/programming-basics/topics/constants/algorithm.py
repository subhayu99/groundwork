# A constant is a value you promise won't change. Convention: UPPER_CASE name.

MAX_SCORE = 100                     # @sync: define
score = 70                          # @sync: use
percent = score / MAX_SCORE * 100   # @sync: read
print(percent)                      # @sync: print
