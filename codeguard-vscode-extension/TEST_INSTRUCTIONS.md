# CodeGuard VS Code Extension - Testing Instructions

## Extension Successfully Compiled! ✓

The extension has been fixed and compiled successfully. Here's how to test it:

## Prerequisites
- Backend server must be running on http://localhost:8000
  ```bash
  cd F:\Codeguard\backend
  python -m uvicorn app.main:app --reload
  ```

## Testing Steps

### 1. Launch Extension Development Host
- Open the extension folder in VS Code: `F:\Codeguard\codeguard-vscode-extension`
- Press **F5** to launch a new VS Code window with the extension loaded
- Or use **Run > Start Debugging** from the menu

### 2. Test the Extension Features

#### A. Analyze a Python File
1. In the Extension Development Host window, create or open a Python file
2. Click the bug icon (🐛) in the editor title bar (top right)
   - OR use Command Palette (Ctrl+Shift+P): "CodeGuard: Analyze Current File"
3. Enter a prompt (optional) or press Enter
4. Check the sidebar panel for results

#### B. Analyze Selected Code
1. Select some Python code in the editor
2. Right-click and select "CodeGuard: Analyze Selection"
   - OR use Command Palette: "CodeGuard: Analyze Selection"
3. Enter a prompt and wait for results

#### C. View Results in Sidebar
1. Click the CodeGuard icon in the Activity Bar (left side)
2. The "Bug Analysis" panel will show:
   - Overall severity score
   - Bug patterns detected
   - Descriptions and fix suggestions

### 3. Test with Buggy Code
Use the test file from the backend:
```python
# Copy code from: F:\Codeguard\backend\test\buggy_code.py
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
```

Expected Results:
- Syntax Error (missing colon)
- Hallucinated Object (PriceCalculator)
- Wrong Attribute (item.cost)
- Silly Mistake (reversed operands)
- Prompt-Biased Code
- Non-Prompted Consideration
- Incomplete Generation

### 4. Configuration
- Go to Settings > Extensions > CodeGuard
- Set `codeguard.apiUrl` if your backend is on a different URL
- Enable `codeguard.autoAnalyze` to analyze on save (optional)

## Troubleshooting

### Extension Not Loading
- Check the Output panel: View > Output > Select "Extension Host"
- Look for "CodeGuard extension is now active!" message

### Connection Errors
- Verify backend is running: http://localhost:8000/docs
- Check the configured API URL in settings
- Look for CORS issues in browser console

### No Analysis Results
- Ensure you're analyzing Python files
- Check the Debug Console for error messages
- Verify the backend response in Network tab

## Files Structure
```
codeguard-vscode-extension/
├── src/
│   ├── extension.ts          # Main extension logic
│   ├── services/
│   │   └── apiService.ts     # Backend API calls
│   └── webview/
│       └── SidePanel.ts      # Sidebar UI
├── media/
│   ├── icon.png              # Extension icon
│   └── icon.svg              # Sidebar icon
└── package.json              # Extension manifest
```

## Next Steps
1. Test all features thoroughly
2. Report any bugs or issues
3. Consider adding more features:
   - Auto-analysis on save
   - Export results to file
   - Historical analysis comparison
   - Custom bug pattern configuration
