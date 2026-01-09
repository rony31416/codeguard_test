from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CodeAnalysisRequest(BaseModel):
    prompt: str
    code: str

class BugPattern(BaseModel):
    pattern_name: str
    severity: int
    confidence: float
    description: str
    location: Optional[str] = None
    fix_suggestion: str

class AnalysisResponse(BaseModel):
    id: int
    bug_patterns: List[BugPattern]
    overall_severity: int
    has_bugs: bool
    summary: str
    created_at: datetime

class FeedbackRequest(BaseModel):
    analysis_id: int
    feedback: str
    comment: Optional[str] = None
