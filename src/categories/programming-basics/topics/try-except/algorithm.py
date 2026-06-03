# try runs risky code; if it raises an error, except catches it instead of crashing.

def safe_divide(a, b):          # @sync: def
    try:                        # @sync: try
        return a / b            # @sync: divide
    except ZeroDivisionError:   # @sync: except
        return 0                # @sync: handle

print(safe_divide(10, 2))       # @sync: ok
print(safe_divide(10, 0))       # @sync: zero
