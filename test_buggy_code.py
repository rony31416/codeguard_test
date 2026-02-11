# Test file for CodeGuard Extension
# This code contains intentional bugs for testing

def calculate_discount(price, discount_percent):
    """Calculate discounted price"""
    discount = price * discount_percent  # Bug: Should divide by 100
    final_price = price - discount
    return final_price

def process_users(users_list):
    """Process user data"""
    for user in users_list:
        print(user.fullname)  # Bug: Attribute might not exist
        
    return users_list.sort()  # Bug: sort() returns None

def divide_numbers(a, b):
    """Divide two numbers"""
    return a / b  # Bug: No check for division by zero

# Test the functions
result = calculate_discount(100, 20)
print(f"Discounted price: {result}")

users = [{"name": "John"}, {"name": "Jane"}]
process_users(users)

divide_numbers(10, 0)
