export interface BugPattern {
    pattern_name: string;
    severity: number;
    confidence: number;
    description: string;
    location: string | null;
    fix_suggestion: string;
}

export interface AnalysisResponse {
    analysis_id: number;
    bug_patterns: BugPattern[];
    execution_logs: any[];
    overall_severity: number;
    has_bugs: boolean;
    summary: string;
    created_at: string;
}

export interface FeedbackRequest {
    analysis_id: number;
    rating: number;
    comment?: string;
    is_helpful: boolean;
}

export interface FeedbackResponse {
    id: number;
    analysis_id: number;
    rating: number;
    comment?: string;
    is_helpful: boolean;
    created_at: string;
}