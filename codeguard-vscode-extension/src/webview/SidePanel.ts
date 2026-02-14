import * as vscode from 'vscode';
import { analyzeCode, submitFeedback } from '../services/apiService';

export class CodeGuardPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codeguard.sidePanel';
    private _view?: vscode.WebviewView;
    private _currentEditor?: vscode.TextEditor;
    private _decorationType?: vscode.TextEditorDecorationType;

    constructor(private readonly _extensionUri: vscode.Uri) {
        // Create decoration type for bug highlighting
        this._decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid red',
            borderRadius: '2px'
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
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

    private async handleAnalyzeRequest(data: any) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found!');
                return;
            }

            // Store current editor reference
            this._currentEditor = editor;

            // ALWAYS analyze the full file (ignore selection for consistency)
            const code = editor.document.getText();
            const fileName = editor.document.fileName.split(/[\\\/]/).pop() || 'file';

            if (!code.trim()) {
                vscode.window.showWarningMessage('File is empty!');
                return;
            }

            // Get prompt from sidebar input
            const prompt = data.prompt?.trim() || 'No prompt provided';

            // Show what's being analyzed for debugging
            console.log('[CodeGuard] Analyzing:', {
                fileName,
                codeLength: code.length,
                promptLength: prompt.length,
                prompt: prompt.substring(0, 50) + '...'
            });

            // Check if using production backend
            const config = vscode.workspace.getConfiguration('codeguard');
            const useLocal = config.get<boolean>('useLocalBackend', false);
            const apiUrl = config.get<string>('apiUrl', '');
            
            // Show cold start warning for production backend
            if (!useLocal && apiUrl.includes('render.com')) {
                vscode.window.showInformationMessage('Connecting to backend... First request may take 30-50 seconds (cold start)');
            }

            // Show loading state
            this.showLoading();

            // Analyze code
            const result = await analyzeCode({
                prompt: prompt,
                code: code
            });

            // Log result for debugging
            console.log('[CodeGuard] Analysis complete:', {
                analysisId: result.analysis_id,
                bugsFound: result.bug_patterns.length,
                severity: result.overall_severity
            });

            // Show results
            this.showAnalysis(result);

            // Add decorations to editor for bug highlighting
            this.addBugDecorations(editor, result.bug_patterns);

            // Send completion message
            this._view?.webview.postMessage({ command: 'analysisComplete' });

            // Show notification with file name
            if (result.has_bugs) {
                vscode.window.showWarningMessage(
                    `CodeGuard: Found ${result.bug_patterns.length} bug pattern(s) in ${fileName}`
                );
            } else {
                vscode.window.showInformationMessage('CodeGuard: No obvious bugs detected');
            }
        } catch (error: any) {
            this._view?.webview.postMessage({ command: 'analysisComplete' });
            vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
        }
    }

    private async handleFeedbackSubmission(feedbackData: any) {
        try {
            await submitFeedback(feedbackData);

            // Send success message to webview
            this._view?.webview.postMessage({
                command: 'feedbackSuccess'
            });

            vscode.window.showInformationMessage('Thank you for your feedback!');
        } catch (error: any) {
            // Send error message to webview
            this._view?.webview.postMessage({
                command: 'feedbackError',
                error: error.message
            });

            vscode.window.showErrorMessage(`Failed to submit feedback: ${error.message}`);
        }
    }

    public showLoading() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'showLoading' });
        }
    }

    public showAnalysis(analysisResult: any) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'showAnalysis',
                data: analysisResult
            });
        }
    }

    private addBugDecorations(editor: vscode.TextEditor, bugPatterns: any[]) {
        if (!this._decorationType) {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];

        for (const bug of bugPatterns) {
            // Try to extract line number from location
            const lineMatch = bug.location?.match(/Line (\d+)/);
            if (lineMatch) {
                const lineNumber = parseInt(lineMatch[1]) - 1; // 0-indexed
                if (lineNumber >= 0 && lineNumber < editor.document.lineCount) {
                    const line = editor.document.lineAt(lineNumber);
                    const range = new vscode.Range(
                        lineNumber, 0,
                        lineNumber, line.text.length
                    );
                    decorations.push({
                        range,
                        hoverMessage: `**${bug.pattern_name}** (Severity: ${bug.severity}/10)\n\n${bug.description}\n\n**Fix:** ${bug.fix_suggestion}`
                    });
                }
            }
        }

        editor.setDecorations(this._decorationType, decorations);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Try multiple paths for robustness
        const fs = require('fs');
        const path = require('path');
        
        // Path 1: Development mode (src folder exists)
        let htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'webview.html');
        
        try {
            if (fs.existsSync(htmlPath.fsPath)) {
                return fs.readFileSync(htmlPath.fsPath, 'utf8');
            }
        } catch (error) {
            // Continue to next path
        }
        
        // Path 2: Production mode (out folder)
        htmlPath = vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'webview.html');
        try {
            if (fs.existsSync(htmlPath.fsPath)) {
                return fs.readFileSync(htmlPath.fsPath, 'utf8');
            }
        } catch (error) {
            // Continue to next path
        }
        
        // Path 3: Root of extension (fallback)
        htmlPath = vscode.Uri.joinPath(this._extensionUri, 'webview.html');
        try {
            if (fs.existsSync(htmlPath.fsPath)) {
                return fs.readFileSync(htmlPath.fsPath, 'utf8');
            }
        } catch (error) {
            // Final fallback
        }
        
        // If all paths fail, return error message in HTML
        return `<!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="padding: 20px; color: #fff;">
            <h3>Error Loading CodeGuard Panel</h3>
            <p>Could not find webview.html in any expected location.</p>
            <p>Extension URI: ${this._extensionUri.fsPath}</p>
            <p>Please try reloading VS Code or reinstalling the extension.</p>
        </body>
        </html>`;
    }
}
