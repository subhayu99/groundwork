# A while loop repeats its block as long as the condition stays True.

count = 0                # @sync: init
while count < 3:         # @sync: cond
    print(count)         # @sync: body
    count = count + 1    # @sync: step
print("done")            # @sync: after
