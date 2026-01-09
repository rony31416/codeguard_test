export interface BugPattern {
  pattern_name: string;
  severity: number;
  confidence: number;
  description: string;
  location: string | null;
  fix_suggestion: string;
}

export interface AnalysisResponse {
  id: number;
  bug_patterns: BugPattern[];
  overall_severity: number;
  has_bugs: boolean;
  summary: string;
  created_at: string;
}

export interface CodeAnalysisRequest {
  prompt: string;
  code: string;
}
