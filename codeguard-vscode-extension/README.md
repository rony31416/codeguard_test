# CodeGuard VS Code Extension

AI-Powered Bug Detection for LLM-Generated Code

## Features

- **🔍 Static Analysis**: Detects syntax errors, hallucinated objects, incomplete generation, and silly mistakes
- **⚡ Dynamic Analysis**: Executes code in a sandbox to catch runtime errors
- **🎯 Bug Taxonomy**: Classifies bugs according to a comprehensive taxonomy specific to LLM-generated code
- **📊 Severity Scoring**: Provides severity ratings (0-10) for detected issues
- **💡 Fix Suggestions**: Offers actionable recommendations to fix detected bugs
- **🎨 Visual Decorations**: Highlights problematic code directly in the editor
- **📱 Sidebar Panel**: Dedicated panel for viewing detailed analysis results

## Requirements

- **VS Code**: Version 1.85.0 or higher
- **Backend Server**: CodeGuard backend must be running (default: http://localhost:8000)
- **Python**: For analyzing Python code (recommended)

## Installation

1. Clone the repository
2. Navigate to the extension directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the extension:
   ```bash
   npm run compile
   ```
5. Press F5 to launch the Extension Development Host

## Usage

### Analyze Current File
1. Open a Python file
2. Click the bug icon (🐛) in the editor title bar
3. Or use Command Palette: `CodeGuard: Analyze Current File`
4. Enter the prompt used to generate the code (optional)
5. View results in the sidebar

### Analyze Selection
1. Select code in the editor
2. Right-click and choose `CodeGuard: Analyze Selection`
3. Or use Command Palette: `CodeGuard: Analyze Selection`
4. Enter the prompt and view results

### View Analysis Results
- Click the CodeGuard icon in the Activity Bar (left sidebar)
- Results show:
  - Overall severity score
  - Detected bug patterns
  - Detailed descriptions
  - Fix suggestions
  - Confidence scores

## Configuration

Access settings via File > Preferences > Settings > Extensions > CodeGuard

- **API URL**: Backend server URL (default: `http://localhost:8000`)
- **Auto Analyze**: Automatically analyze code on save (default: `false`)

## Bug Taxonomy

CodeGuard detects 10 types of bugs common in LLM-generated code:

1. **Syntax Error** - Missing colons, unmatched parentheses, etc.
2. **Hallucinated Object** - References to non-existent functions/classes
3. **Incomplete Generation** - Code that was cut off mid-generation
4. **Silly Mistake** - Logic reversals, wrong operands
5. **Wrong Attribute** - Incorrect attribute/method access
6. **Wrong Input Type** - Type mismatches in operations
7. **Prompt-Biased Code** - Hardcoded example values
8. **Non-Prompted Consideration** - Unrequested features
9. **Missing Corner Case** - Missing edge case handling
10. **Misinterpretation** - Fundamental logic errors

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

4. Verify it's running: http://localhost:8000/docs

## Example

```python
# This buggy code will be detected:
def calculate_discount(price, rate):
    if not price  # Missing colon - Syntax Error
        return 0
    
    calc = PriceCalculator()  # Hallucinated Object
    discount = rate - price   # Silly Mistake (reversed)
    final =                   # Incomplete Generation
```

## Architecture

```
Extension (VS Code)
    ↓ HTTP POST
Backend API (FastAPI)
    ↓
┌─────────────────────┐
│ Static Analyzer     │ → AST parsing, pyflakes
│ Dynamic Analyzer    │ → Docker sandbox execution
│ Linguistic Analyzer │ → Prompt-code comparison
└─────────────────────┘
    ↓
Taxonomy Classifier
    ↓
Results + Fix Suggestions
```

## Development

### Compile
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Debug
1. Press F5 in VS Code
2. A new Extension Development Host window will open
3. Test the extension in this window

### Lint
```bash
npm run lint
```

## Troubleshooting

### Extension Not Activating
- Check Output panel: View > Output > Extension Host
- Look for "CodeGuard extension is now active!"

### Connection Errors
- Verify backend is running: http://localhost:8000/health
- Check API URL in settings
- Ensure no firewall blocking port 8000

### No Analysis Results
- Confirm file is Python (extension works best with Python)
- Check Debug Console for errors
- Verify backend API is responding

## Known Issues

- Currently optimized for Python code only
- Requires backend server to be running locally
- Large files may take longer to analyze

## Release Notes

### 1.0.0
- Initial release
- Static and dynamic analysis
- Bug taxonomy classification
- Sidebar panel UI
- Editor decorations
- Fix suggestions

## Contributing

Issues and pull requests are welcome!

## License

MIT

## Credits

Built for analyzing LLM-generated code using a comprehensive bug taxonomy.
