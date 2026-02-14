# Test file for verifying consistent analysis results
# This file should give the SAME results from both:
# 1. Sidebar "Analyze Entire File" button
# 2. Top-right CodeGuard icon button

def calculate_discount(price, percent):
    """Calculate discount - has bug"""
    discount = price * percent  # BUG: Should divide by 100
    return price - discount

def process_users(users):
    """Process user list - has bug"""
    for user in users:
        print(user.fullname)  # BUG: Attribute might not exist
    return users.sort()  # BUG: sort() returns None

def divide(a, b):
    """Divide numbers - has bug"""
    return a / b  # BUG: No zero check

# Test calls
result = calculate_discount(100, 20)
users = [{"name": "John"}, {"name": "Jane"}] 
process_users(users)
divide(10, 0)
