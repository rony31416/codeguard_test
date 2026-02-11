"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const SidePanel_1 = require("./webview/SidePanel");
const apiService_1 = require("./services/apiService");
function activate(context) {
    console.log('CodeGuard extension is now active!');
    // Register sidebar panel provider
    const provider = new SidePanel_1.CodeGuardPanel(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('codeguard.sidePanel', provider));
    // Command: Analyze current file
    let analyzeFileCommand = vscode.commands.registerCommand('codeguard.analyzeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }
        // Get the entire file content
        const code = editor.document.getText();
        const fileName = editor.document.fileName;
        // Check if it's Python
        if (editor.document.languageId !== 'python') {
            const proceed = await vscode.window.showWarningMessage('CodeGuard is optimized for Python. Continue anyway?', 'Yes', 'No');
            if (proceed !== 'Yes')
                return;
        }
        // Prompt user for the original prompt
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter the prompt used to generate this code (optional)',
            placeHolder: 'e.g., "Write a function to calculate discount..."',
            ignoreFocusOut: true
        });
        // Show progress
        provider.showLoading();
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "CodeGuard: Analyzing code...",
            cancellable: false
        }, async (progress) => {
            try {
                // Call backend API
                const result = await (0, apiService_1.analyzeCode)({
                    prompt: prompt || 'No prompt provided',
                    code: code
                });
                // Send result to sidebar panel
                provider.showAnalysis(result);
                // Show notification
                if (result.has_bugs) {
                    vscode.window.showWarningMessage(`CodeGuard: Found ${result.bug_patterns.length} bug pattern(s)`, 'View Details').then(selection => {
                        if (selection === 'View Details') {
                            vscode.commands.executeCommand('codeguard.sidePanel.focus');
                        }
                    });
                }
                else {
                    vscode.window.showInformationMessage('CodeGuard: No obvious bugs detected');
                }
                // Add decorations to editor
                addBugDecorations(editor, result.bug_patterns);
            }
            catch (error) {
                vscode.window.showErrorMessage(`CodeGuard analysis failed: ${error.message}`);
            }
        });
    });
    // Command: Analyze selection
    let analyzeSelectionCommand = vscode.commands.registerCommand('codeguard.analyzeSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const code = editor.document.getText(selection);
        if (!code) {
            vscode.window.showWarningMessage('No code selected!');
            return;
        }
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter the prompt for this code snippet',
            placeHolder: 'Original prompt...'
        });
        provider.showLoading();
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing selection...",
            cancellable: false
        }, async () => {
            try {
                const result = await (0, apiService_1.analyzeCode)({
                    prompt: prompt || 'No prompt',
                    code: code
                });
                provider.showAnalysis(result);
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
        });
    });
    context.subscriptions.push(analyzeFileCommand, analyzeSelectionCommand);
}
// Add visual decorations to highlight bugs in editor
function addBugDecorations(editor, bugPatterns) {
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        border: '1px solid red',
        borderRadius: '2px'
    });
    const decorations = [];
    for (const bug of bugPatterns) {
        // Try to extract line number from location
        const lineMatch = bug.location?.match(/Line (\d+)/);
        if (lineMatch) {
            const lineNumber = parseInt(lineMatch[1]) - 1; // 0-indexed
            const line = editor.document.lineAt(lineNumber);
            const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
            decorations.push({
                range,
                hoverMessage: `**${bug.pattern_name}** (Severity: ${bug.severity}/10)\n\n${bug.description}`
            });
        }
    }
    editor.setDecorations(decorationType, decorations);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map