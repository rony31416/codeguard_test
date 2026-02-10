import axios from 'axios';
import * as vscode from 'vscode';

interface CodeAnalysisRequest {
    prompt: string;
    code: string;
}

interface AnalysisResponse {
    analysis_id: number;
    bug_patterns: any[];
    execution_logs: any[];
    overall_severity: number;
    has_bugs: boolean;
    summary: string;
    created_at: string;
}

export async function analyzeCode(request: CodeAnalysisRequest): Promise<AnalysisResponse> {
    const config = vscode.workspace.getConfiguration('codeguard');
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000');

    try {
        const response = await axios.post<AnalysisResponse>(
            `${apiUrl}/api/analyze`,
            request,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000 // 30 seconds
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data.detail || error.message}`);
        } else if (error.request) {
            throw new Error('Cannot connect to CodeGuard backend. Make sure it\'s running on ' + apiUrl);
        } else {
            throw new Error(error.message);
        }
    }
}
