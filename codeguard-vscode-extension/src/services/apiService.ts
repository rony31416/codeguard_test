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

interface FeedbackRequest {
    analysis_id: number;
    rating: number;
    comment?: string;
    is_helpful: boolean;
}

interface FeedbackResponse {
    id: number;
    analysis_id: number;
    rating: number;
    comment?: string;
    is_helpful: boolean;
    created_at: string;
}

export async function analyzeCode(request: CodeAnalysisRequest): Promise<AnalysisResponse> {
    const config = vscode.workspace.getConfiguration('codeguard');
    const useLocal = config.get<boolean>('useLocalBackend', false);
    
    // Production backend on Render.com
    const defaultUrl = 'https://codeguard-backend-g7ka.onrender.com';
    const localUrl = 'http://localhost:8000';
    const apiUrl = useLocal ? localUrl : config.get<string>('apiUrl', defaultUrl);

    try {
        const response = await axios.post<AnalysisResponse>(
            `${apiUrl}/api/analyze`,
            request,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 90000 // 90 seconds for Render cold start
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

export async function submitFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const config = vscode.workspace.getConfiguration('codeguard');
    const useLocal = config.get<boolean>('useLocalBackend', false);
    
    // Production backend on Render.com
    const defaultUrl = 'https://codeguard-backend-g7ka.onrender.com';
    const localUrl = 'http://localhost:8000';
    const apiUrl = useLocal ? localUrl : config.get<string>('apiUrl', defaultUrl);

    try {
        const response = await axios.post<FeedbackResponse>(
            `${apiUrl}/api/feedback`,
            request,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`Feedback Error: ${error.response.data.detail || error.message}`);
        } else if (error.request) {
            throw new Error('Cannot submit feedback. Backend not reachable.');
        } else {
            throw new Error(error.message);
        }
    }
}
