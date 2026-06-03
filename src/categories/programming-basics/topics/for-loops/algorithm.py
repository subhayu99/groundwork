# A for loop runs its block once for each item in a collection.

total = 0                    # @sync: init
for price in [10, 20, 30]:   # @sync: for
    total = total + price    # @sync: body
print(total)                 # @sync: after
