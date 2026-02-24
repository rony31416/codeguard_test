# CodeGuard Extension - Installation Fix (v0.0.8)

## Problems Fixed

### Issue 1: Sidebar Not Opening (Loading Forever)
**Root Cause:** The `webview.html` file was not being copied to the `out/` directory during the build process, causing the webview to fail loading when installed on a new machine.

**Fix:** Updated `esbuild.js` to automatically copy `webview.html` to `out/webview/` directory during compilation.

### Issue 2: Command 'codeguard.analyzeCode' Not Found
**Root Cause:** The `codeguard.openPanel` command was declared in `package.json` but not implemented in `extension.ts`.

**Fix:** Added the missing command registration in `extension.ts`.

## Installation Instructions for Your Laptop

### Method 1: Install from VSIX File (Recommended)

1. **Copy the VSIX file** to your laptop:
   - File: `codeguard-llm-bugs-classifier-0.0.8.vsix`
   - Location: `F:\Codeguard\codeguard-vscode-extension\`

2. **Uninstall the old version** (if installed):
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Find "CodeGuard LLM Bugs Classifier"
   - Click the gear icon → Uninstall
   - Reload VS Code

3. **Install the new version**:
   - Open VS Code
   - Press `Ctrl+Shift+P` (Command Palette)
   - Type: "Extensions: Install from VSIX..."
   - Select the `codeguard-llm-bugs-classifier-0.0.8.vsix` file
   - Wait for installation to complete
   - Reload VS Code

4. **Verify the installation**:
   - Look for the CodeGuard icon in the Activity Bar (left sidebar)
   - Click it to open the sidebar panel
   - The panel should load immediately (no infinite loading)
   - Click the bug icon in the top-right corner of a Python file
   - Both methods should work without errors

### Method 2: Build from Source

If you prefer to build from source on your laptop:

```bash
# Navigate to the extension directory
cd F:\Codeguard\codeguard-vscode-extension

# Install dependencies (if not already done)
npm install

# Compile the extension
npm run compile

# Package into VSIX
npx vsce package

# Install the generated VSIX file (see Method 1, step 3)
```

## What Changed

### 1. `esbuild.js` - Added Webview Copy Logic
```javascript
const copyWebviewFiles = () => {
    const srcDir = path.join(__dirname, 'src', 'webview');
    const outDir = path.join(__dirname, 'out', 'webview');
    
    // Create out/webview directory if it doesn't exist
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Copy webview.html
    const htmlSrc = path.join(srcDir, 'webview.html');
    const htmlDest = path.join(outDir, 'webview.html');
    
    if (fs.existsSync(htmlSrc)) {
        fs.copyFileSync(htmlSrc, htmlDest);
        console.log('✓ Copied webview.html to out/webview/');
    }
};
```

### 2. `extension.ts` - Added Missing Command
```typescript
// Command: Open Panel (focus on the sidebar)
let openPanelCommand = vscode.commands.registerCommand(
    'codeguard.openPanel',
    async () => {
        await vscode.commands.executeCommand('codeguard.sidePanel.focus');
    }
);
```

### 3. `.vscodeignore` - Simplified Package Include Rules
- Now properly excludes all `src/**` files
- Includes the entire `out/` directory (which contains compiled JS + webview.html)
- VSIX package is much cleaner

### 4. `SidePanel.ts` - Improved HTML Loading
- Reorganized search paths (production path first)
- Added better error messages and logging
- Shows detailed troubleshooting info if webview fails to load

## Verification Checklist

After installing v0.0.8, verify that:

- [ ] CodeGuard icon appears in the Activity Bar
- [ ] Clicking the icon opens the sidebar panel (no infinite loading)
- [ ] Sidebar shows the prompt input and "Analyze Entire File" button
- [ ] Bug icon in top-right corner works (for Python files)
- [ ] No "command not found" errors
- [ ] Analysis works correctly (may take 30-50s for first request if using production backend)

## Troubleshooting

### If sidebar still doesn't open:

1. Open Developer Console: `Help` → `Toggle Developer Tools`
2. Look for errors in the Console tab
3. Check if you see: `[CodeGuard] Loading webview from: ...`
4. If you see path errors, try reinstalling or rebuilding

### If commands still don't work:

1. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check extension is activated: Look for `CodeGuard extension is now active!` in the Output panel (CodeGuard channel)

## Version History

- **v0.0.8** (Latest): Fixed webview loading and missing command issues
- **v0.0.7**: Previous version (had installation issues on fresh machines)

---

**Created:** February 24, 2026  
**Author:** CodeGuard Team
