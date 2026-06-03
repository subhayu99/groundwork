# A function packages steps under a name: take inputs, return an output.

def area(width, height):     # @sync: def
    return width * height    # @sync: return

room = area(4, 3)            # @sync: call1
hall = area(10, 2)           # @sync: call2
print(room, hall)            # @sync: print
