from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
from datetime import datetime
from .database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    code = Column(Text, nullable=False)
    bug_patterns = Column(Text)
    severity_score = Column(Integer)
    confidence_score = Column(Float)
    explanation = Column(Text)
    fix_suggestions = Column(Text)
    user_feedback = Column(String(20))
    feedback_comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
