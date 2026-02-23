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
    status?: string; // "processing" | "complete" | undefined
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

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Poll GET /api/analysis/{id} every 15 s until the backend marks the
 * analysis as complete (linguistic background task finished).
 * Gives up after ~5 minutes and returns whatever is in the DB at that point.
 */
async function pollForCompletion(
    analysisId: number,
    apiUrl: string,
    onProgress?: (attempt: number) => void,
): Promise<AnalysisResponse> {
    const MAX_ATTEMPTS = 20;   // 20 × 15 s = 5 min
    const INTERVAL_MS  = 15000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await sleep(INTERVAL_MS);
        if (onProgress) { onProgress(attempt); }
        try {
            const resp = await axios.get<AnalysisResponse>(
                `${apiUrl}/api/analysis/${analysisId}`,
                { timeout: 30000 },
            );
            if (resp.data.status !== 'processing') {
                return resp.data;
            }
        } catch {
            // transient error — keep polling
        }
    }
    // Last attempt — return whatever we have
    const final = await axios.get<AnalysisResponse>(
        `${apiUrl}/api/analysis/${analysisId}`,
        { timeout: 30000 },
    );
    return final.data;
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
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000, // 60 s — backend now returns in <2 s
            }
        );

        // Backend returns immediately with status="processing".
        // Linguistic analysis runs in background; poll for the final result.
        if (response.data.status === 'processing') {
            return await pollForCompletion(response.data.analysis_id, apiUrl);
        }

        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`API Error: ${error.response.data.detail || error.message}`);
        } else if (error.request) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Analysis timed out. The server may be starting up — please try again in 30 seconds.');
            }
            if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to CodeGuard backend. Make sure it's running on ${apiUrl}`);
            }
            throw new Error(`Cannot connect to CodeGuard backend. Make sure it's running on ${apiUrl}`);
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
