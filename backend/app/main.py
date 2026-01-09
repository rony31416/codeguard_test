from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from .database import engine, get_db, Base
from .schemas import CodeAnalysisRequest, AnalysisResponse, FeedbackRequest, BugPattern
from .models import Analysis
from .analyzers.static_analyzer import StaticAnalyzer
from .analyzers.dynamic_analyzer import DynamicAnalyzer
from .analyzers.classifier import TaxonomyClassifier
from .analyzers.explainer import ExplainabilityLayer

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeGuard API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "CodeGuard API is running", "version": "1.0.0"}

# @app.post("/api/analyze", response_model=AnalysisResponse)
# def analyze_code(request: CodeAnalysisRequest, db: Session = Depends(get_db)):
#     """
#     Main analysis endpoint: performs static and dynamic analysis
#     """
#     try:
#         # Stage 1: Static Analysis
#         static_analyzer = StaticAnalyzer(request.code)
#         static_results = static_analyzer.analyze()
        
#         # Stage 2: Dynamic Analysis
#         dynamic_analyzer = DynamicAnalyzer(request.code)
#         dynamic_results = dynamic_analyzer.analyze()
        
#         # Stage 3: Classification
#         classifier = TaxonomyClassifier(static_results, dynamic_results)
#         bug_patterns = classifier.classify()
        
#         # Stage 4: Explainability
#         explainer = ExplainabilityLayer()
#         summary = explainer.generate_summary(bug_patterns)
#         overall_severity = classifier.get_overall_severity()
#         has_bugs = classifier.has_bugs()
        
#         # Save to database
#         analysis = Analysis(
#             prompt=request.prompt,
#             code=request.code,
#             bug_patterns=json.dumps([p.dict() for p in bug_patterns]),
#             severity_score=overall_severity,
#             confidence_score=sum(p.confidence for p in bug_patterns) / len(bug_patterns) if bug_patterns else 0,
#             explanation=summary,
#             fix_suggestions=json.dumps([p.fix_suggestion for p in bug_patterns])
#         )
#         db.add(analysis)
#         db.commit()
#         db.refresh(analysis)
        
#         return AnalysisResponse(
#             id=analysis.id,
#             bug_patterns=bug_patterns,
#             overall_severity=overall_severity,
#             has_bugs=has_bugs,
#             summary=summary,
#             created_at=analysis.created_at
#         )
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")



@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_code(request: CodeAnalysisRequest, db: Session = Depends(get_db)):
    """
    Main analysis endpoint: performs static and dynamic analysis
    """
    try:
        print(f"Received request - Prompt: {request.prompt[:50]}, Code length: {len(request.code)}")
        
        # Stage 1: Static Analysis
        static_analyzer = StaticAnalyzer(request.code)
        static_results = static_analyzer.analyze()
        print(f"Static analysis complete: {static_results}")
        
        # Stage 2: Dynamic Analysis
        dynamic_analyzer = DynamicAnalyzer(request.code)
        dynamic_results = dynamic_analyzer.analyze()
        print(f"Dynamic analysis complete: {dynamic_results}")
        
        # Stage 3: Classification
        classifier = TaxonomyClassifier(static_results, dynamic_results)
        bug_patterns = classifier.classify()
        
        # Stage 4: Explainability
        explainer = ExplainabilityLayer()
        summary = explainer.generate_summary(bug_patterns)
        overall_severity = classifier.get_overall_severity()
        has_bugs = classifier.has_bugs()
        
        # Save to database
        analysis = Analysis(
            prompt=request.prompt,
            code=request.code,
            # bug_patterns=json.dumps([p.dict() for p in bug_patterns]),
            bug_patterns=json.dumps([p.model_dump() if hasattr(p, 'model_dump') else p.dict() for p in bug_patterns]),
            severity_score=overall_severity,
            confidence_score=sum(p.confidence for p in bug_patterns) / len(bug_patterns) if bug_patterns else 0,
            explanation=summary,
            fix_suggestions=json.dumps([p.fix_suggestion for p in bug_patterns])
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return AnalysisResponse(
            id=analysis.id,
            bug_patterns=bug_patterns,
            overall_severity=overall_severity,
            has_bugs=has_bugs,
            summary=summary,
            created_at=analysis.created_at
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR: {error_details}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")



@app.post("/api/feedback")
def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Submit user feedback on analysis accuracy
    """
    analysis = db.query(Analysis).filter(Analysis.id == feedback.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis.user_feedback = feedback.feedback
    analysis.feedback_comment = feedback.comment
    db.commit()
    
    return {"message": "Feedback submitted successfully"}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    """
    Get analysis history
    """
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(20).all()
    return {"analyses": [
        {
            "id": a.id,
            "prompt": a.prompt[:100] + "..." if len(a.prompt) > 100 else a.prompt,
            "severity": a.severity_score,
            "created_at": a.created_at
        }
        for a in analyses
    ]}

@app.get("/api/analysis/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """
    Get specific analysis details
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "id": analysis.id,
        "prompt": analysis.prompt,
        "code": analysis.code,
        "bug_patterns": json.loads(analysis.bug_patterns) if analysis.bug_patterns else [],
        "severity_score": analysis.severity_score,
        "explanation": analysis.explanation,
        "created_at": analysis.created_at
    }
