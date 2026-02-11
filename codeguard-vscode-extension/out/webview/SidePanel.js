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
exports.CodeGuardPanel = void 0;
const vscode = __importStar(require("vscode"));
const apiService_1 = require("../services/apiService");
class CodeGuardPanel {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        // Create decoration type for bug highlighting
        this._decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid red',
            borderRadius: '2px'
        });
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'analyzeCode':
                    await this.handleAnalyzeRequest(message.data);
                    break;
                case 'submitFeedback':
                    await this.handleFeedbackSubmission(message.data);
                    break;
            }
        });
    }
    async handleAnalyzeRequest(data) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found!');
                return;
            }
            // Store current editor reference
            this._currentEditor = editor;
            // Get selected text or entire document
            const selection = editor.selection;
            let code;
            if (selection.isEmpty) {
                // No selection, analyze entire file
                code = editor.document.getText();
            }
            else {
                // Analyze selection
                code = editor.document.getText(selection);
            }
            if (!code.trim()) {
                vscode.window.showWarningMessage('No code to analyze!');
                return;
            }
            // Show loading state
            this.showLoading();
            // Analyze code
            const result = await (0, apiService_1.analyzeCode)({
                prompt: data.prompt || 'No prompt provided',
                code: code
            });
            // Show results
            this.showAnalysis(result);
            // Add decorations to editor for bug highlighting
            this.addBugDecorations(editor, result.bug_patterns);
            // Send completion message
            this._view?.webview.postMessage({ command: 'analysisComplete' });
            // Show notification
            if (result.has_bugs) {
                vscode.window.showWarningMessage(`CodeGuard: Found ${result.bug_patterns.length} bug pattern(s)`);
            }
            else {
                vscode.window.showInformationMessage('CodeGuard: No obvious bugs detected');
            }
        }
        catch (error) {
            this._view?.webview.postMessage({ command: 'analysisComplete' });
            vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
        }
    }
    async handleFeedbackSubmission(feedbackData) {
        try {
            await (0, apiService_1.submitFeedback)(feedbackData);
            // Send success message to webview
            this._view?.webview.postMessage({
                command: 'feedbackSuccess'
            });
            vscode.window.showInformationMessage('Thank you for your feedback!');
        }
        catch (error) {
            // Send error message to webview
            this._view?.webview.postMessage({
                command: 'feedbackError',
                error: error.message
            });
            vscode.window.showErrorMessage(`Failed to submit feedback: ${error.message}`);
        }
    }
    showLoading() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'showLoading' });
        }
    }
    showAnalysis(analysisResult) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'showAnalysis',
                data: analysisResult
            });
        }
    }
    addBugDecorations(editor, bugPatterns) {
        if (!this._decorationType) {
            return;
        }
        const decorations = [];
        for (const bug of bugPatterns) {
            // Try to extract line number from location
            const lineMatch = bug.location?.match(/Line (\d+)/);
            if (lineMatch) {
                const lineNumber = parseInt(lineMatch[1]) - 1; // 0-indexed
                if (lineNumber >= 0 && lineNumber < editor.document.lineCount) {
                    const line = editor.document.lineAt(lineNumber);
                    const range = new vscode.Range(lineNumber, 0, lineNumber, line.text.length);
                    decorations.push({
                        range,
                        hoverMessage: `**${bug.pattern_name}** (Severity: ${bug.severity}/10)\n\n${bug.description}\n\n**Fix:** ${bug.fix_suggestion}`
                    });
                }
            }
        }
        editor.setDecorations(this._decorationType, decorations);
    }
    _getHtmlForWebview(webview) {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'webview.html');
        const fs = require('fs');
        return fs.readFileSync(htmlPath.fsPath, 'utf8');
    }
}
exports.CodeGuardPanel = CodeGuardPanel;
CodeGuardPanel.viewType = 'codeguard.sidePanel';
//# sourceMappingURL=SidePanel.js.map