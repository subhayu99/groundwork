# if / elif / else: check conditions top to bottom, run exactly one block.

score = 72              # @sync: var
if score >= 90:         # @sync: if
    grade = "A"         # @sync: a
elif score >= 60:       # @sync: elif
    grade = "B"         # @sync: b
else:                   # @sync: else
    grade = "F"         # @sync: f
print(grade)            # @sync: print
