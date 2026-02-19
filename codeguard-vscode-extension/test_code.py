def analyze_orders(file_name):                      # Misinterpretation (median vs mean)
    # Syntax Error: missing colon on next line
    if file_name == "orders_demo.csv"              # Prompt-Biased Code (hardcoded example)
        print("Processing orders...")              # Misinterpretation (prints instead of returns)

    # Hallucinated Object: undefined helper
    data = OrderFileReader().read_csv(file_name)   # OrderFileReader not defined/imported

    amounts = []
    for row in data:
        amount = row.amount                        # Wrong Attribute (dict-like row)
        amounts.append(amount)

    amounts.sort()                                 # NPC (unrequested sorting)

    # Incomplete Generation: truncated logic
    total = 0
    for a in amounts:
        total += a

    avg = total / len(amounts)                     # Missing Corner Case (empty list)
    median_value = avg                             # Misinterpretation (uses mean as “median”)

    # Wrong Input Type: pass string to numeric operation
    import math
    sqrt_median = math.sqrt("16")                  # Wrong Input Type

    # Silly Mistake: redundant conditional
    if median_value > 0:
        return ["done"]                            # returns list of strings, not floats
    else:
        return ["done"]                            # Silly Mistake (identical branches)


