# A variable is a name attached to a value. Store it, read it, change it.

score = 0                  # @sync: create
score = score + 10         # @sync: update
bonus = score * 2          # @sync: use
name = "Ada"               # @sync: another
print(name, score, bonus)  # @sync: read
