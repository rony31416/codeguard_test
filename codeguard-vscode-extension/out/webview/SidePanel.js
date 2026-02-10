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
class CodeGuardPanel {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'analyzeFile':
                    vscode.commands.executeCommand('codeguard.analyzeCode');
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'codeguard');
                    break;
            }
        });
    }
    updateAnalysis(result, fileName) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'analysisResult',
                result: result,
                fileName: fileName
            });
        }
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeGuard Analysis</title>
    <style>
        body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .analyze-btn {
            width: 100%;
            padding: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .analyze-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .results {
            display: none;
        }
        .results.show {
            display: block;
        }
        .severity-box {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid;
        }
        .severity-critical {
            background-color: rgba(255, 0, 0, 0.1);
            border-left-color: #f44336;
        }
        .severity-high {
            background-color: rgba(255, 152, 0, 0.1);
            border-left-color: #ff9800;
        }
        .severity-medium {
            background-color: rgba(255, 235, 59, 0.1);
            border-left-color: #ffeb3b;
        }
        .severity-low {
            background-color: rgba(76, 175, 80, 0.1);
            border-left-color: #4caf50;
        }
        .bug-pattern {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
        }
        .bug-pattern h4 {
            margin: 0 0 8px 0;
            color: var(--vscode-textLink-foreground);
        }
        .bug-pattern p {
            margin: 5px 0;
            font-size: 13px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            margin-right: 5px;
        }
        .badge-severity {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        .badge-confidence {
            background-color: var(--vscode-textPreformat-background);
            color: var(--vscode-textPreformat-foreground);
        }
        .fix-suggestion {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 8px;
            margin-top: 8px;
            font-size: 12px;
        }
        .no-results {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛡️ CodeGuard</div>
        <p style="font-size: 12px; color: var(--vscode-descriptionForeground);">
            LLM Bug Taxonomy Analyzer
        </p>
    </div>

    <button class="analyze-btn" onclick="analyzeCurrentFile()">
        🔍 Analyze Current File
    </button>

    <div id="no-results" class="no-results">
        <p>No analysis yet.</p>
        <p style="font-size: 12px;">Click the button above to analyze your code.</p>
    </div>

    <div id="results" class="results">
        <div id="severity-box"></div>
        <h3>Detected Bug Patterns</h3>
        <div id="bug-patterns"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function analyzeCurrentFile() {
            vscode.postMessage({ type: 'analyzeFile' });
        }

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'analysisResult') {
                displayResults(message.result, message.fileName);
            }
        });

        function displayResults(result, fileName) {
            document.getElementById('no-results').style.display = 'none';
            document.getElementById('results').classList.add('show');

            // Display severity summary
            const severityBox = document.getElementById('severity-box');
            const severityClass = getSeverityClass(result.overall_severity);
            severityBox.className = 'severity-box ' + severityClass;
            severityBox.innerHTML = \`
                <h3>Overall Severity: \${getSeverityLabel(result.overall_severity)}</h3>
                <div style="font-size: 24px; font-weight: bold; margin: 5px 0;">
                    \${result.overall_severity}/10
                </div>
                <p style="font-size: 13px;">\${result.summary}</p>
                <p style="font-size: 11px; margin-top: 10px; opacity: 0.7;">
                    File: \${fileName}
                </p>
            \`;

            // Display bug patterns
            const patternsDiv = document.getElementById('bug-patterns');
            patternsDiv.innerHTML = '';

            result.bug_patterns.forEach(bug => {
                const bugDiv = document.createElement('div');
                bugDiv.className = 'bug-pattern';
                bugDiv.innerHTML = \`
                    <h4>\${bug.pattern_name}</h4>
                    <div>
                        <span class="badge badge-severity">Severity: \${bug.severity}/10</span>
                        <span class="badge badge-confidence">Confidence: \${Math.round(bug.confidence * 100)}%</span>
                    </div>
                    <p>\${bug.description}</p>
                    \${bug.location ? \`<p style="font-size: 11px;"><strong>Location:</strong> \${bug.location}</p>\` : ''}
                    <div class="fix-suggestion">
                        <strong>💡 Fix Suggestion:</strong><br>
                        \${bug.fix_suggestion}
                    </div>
                \`;
                patternsDiv.appendChild(bugDiv);
            });
        }

        function getSeverityClass(severity) {
            if (severity >= 8) return 'severity-critical';
            if (severity >= 6) return 'severity-high';
            if (severity >= 4) return 'severity-medium';
            return 'severity-low';
        }

        function getSeverityLabel(severity) {
            if (severity >= 8) return 'Critical';
            if (severity >= 6) return 'High';
            if (severity >= 4) return 'Medium';
            if (severity > 0) return 'Low';
            return 'No Issues';
        }
    </script>
</body>
</html>`;
    }
}
exports.CodeGuardPanel = CodeGuardPanel;
//# sourceMappingURL=SidePanel.js.map