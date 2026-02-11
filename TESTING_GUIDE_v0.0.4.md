# CodeGuard v0.0.4 - Testing Guide

## What's Fixed and New in v0.0.4

### Fixed Issues:
1. **Feedback System**: Fixed backend schema mismatch - feedback now works properly!
2. **Better Error Handling**: Improved error messages and notifications

### New Features:
1. **Prompt Input in Sidebar**: No more popup dialogs! Enter your prompt directly in the sidebar
2. **Analyze Button in Sidebar**: Click the "Analyze Code" button right in the sidebar
3. **Cleaner UI**: Removed unnecessary emoji icons
4. **Smart Analysis**: Automatically analyzes selected code or entire file

## How to Test

### Step 1: Start the Backend
Open a PowerShell terminal in VS Code:
```powershell
cd F:\Codeguard\backend
F:/Codeguard/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for: `INFO:     Uvicorn running on http://0.0.0.0:8000`

### Step 2: Test the Extension
1. Press `F5` to launch Extension Development Host
2. In the new window, open the test file: `F:\Codeguard\test_buggy_code.py`

### Step 3: Test Analysis Feature
1. Click the CodeGuard icon in the Activity Bar (left sidebar)
2. You should see:
   - Prompt input textarea at the top
   - "Analyze Code" button below it
3. Enter a prompt like: "Write discount calculator and user processor"
4. Click "Analyze Code" button
5. Watch for:
   - Button changes to "Analyzing..."
   - Results appear below
   - Notification shows bug count

### Step 4: Test Selection Analysis
1. Select only the `calculate_discount` function
2. Enter prompt: "Calculate discount from price"
3. Click "Analyze Code"
4. Should analyze only the selected code

### Step 5: Test Feedback System
After analysis completes:
1. Scroll down in sidebar
2. You should see "Rate This Analysis" section
3. Click a star rating (1-5 stars)
4. Click "Helpful" or "Not Helpful"
5. Optionally add a comment
6. Click "Submit Feedback"
7. Should show: "Feedback submitted successfully!"

### Step 6: Verify in Database
Open PostgreSQL and check:
```sql
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 1;
```

You should see your rating, is_helpful, and comment.

## Expected Bugs in Test File

The test file should detect:
1. **Wrong Attribute**: `user.fullname` doesn't exist
2. **Silly Mistake**: `discount_percent` not divided by 100
3. **Incomplete Generation**: No division by zero check
4. **Wrong Return**: `sort()` returns None, not sorted list

## Troubleshooting

### Extension Not Working:
- Make sure backend is running: Visit http://localhost:8000/health
- Check VS Code Output panel for errors
- Verify extension settings: Ctrl+, → search "codeguard"

### Feedback Not Submitting:
- Check backend logs for errors
- Verify analysis_id is being captured
- Check browser/webview console (Help → Toggle Developer Tools)

### Button Not Responding:
- Make sure you have an active editor open
- Try reloading Extension Development Host (Ctrl+R)

## Configuration

Set these in VS Code settings:
- `codeguard.apiUrl`: Backend URL (default: http://localhost:8000)
- `codeguard.useLocalBackend`: true for local testing

## Next Steps

If everything works:
1. Package: `vsce package` (creates .vsix file)
2. Publish: `vsce publish` (publishes to marketplace)

## Notes

- Removed emojis from UI (cleaner look)
- Prompt input now in sidebar (no more dialogs)
- Analyze button always visible in sidebar
- Works on selection or full file automatically
