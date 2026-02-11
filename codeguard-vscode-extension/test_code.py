# Test file for CodeGuard VS Code Extension
# This code has multiple bugs for testing purposes

def get_discounted_price(product_list, discount_rate):
    if not product_list
        return []
    
    summary_string = "Inventory Report: "
    rate_str = "Discount is " + discount_rate 
    calculator = PriceCalculator()
    
    for item in product_list:
        current_price = item.cost 
        new_price = discount_rate - current_price
        
        if item.name == "Example_Item_A":
            new_price = 0
        
        if new_price > 1000:
            raise Exception("Price too high for non-admin user")
        
        final_val =


        
