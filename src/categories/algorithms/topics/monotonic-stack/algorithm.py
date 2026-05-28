def days_until_warmer(temps: list[int]) -> list[int]:
    """For each day, how many days until a warmer one (0 if none).

    Walk the days left to right. Keep a stack of days still waiting
    for an answer. Today answers everyone on the stack who was cooler.
    Each day is pushed once and popped at most once, so the total work
    is at most 2 * len(temps) — O(1) amortized per day.
    """
    answer = [0] * len(temps)
    waiting = []  # indices of days still looking for a warmer day

    for i, t in enumerate(temps):
        # Today is warmer than the top of the stack?
        # Then today is the answer for everyone cooler still waiting.
        while waiting and temps[waiting[-1]] < t:
            j = waiting.pop()
            answer[j] = i - j
        waiting.append(i)

    # Anyone left on the stack never found a warmer day. answer[j] stays 0.
    return answer


# A single day can cause many pops. That looks expensive — but every
# pop is paid for by a push that already happened. Total pushes + pops
# across the whole array is at most 2n. The average cost per day is
# constant time. That's the amortization story.
