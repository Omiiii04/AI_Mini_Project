from sqlalchemy import Column, Integer, String, Text, DateTime
import datetime
from pydantic import BaseModel, Field
from database import Base

# SQLAlchemy Models
class SessionDB(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    domain = Column(String, index=True)
    difficulty = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class MessageDB(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String) # 'user' or 'assistant'
    content = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

# Pydantic Schemas for API
class StartSessionRequest(BaseModel):
    domain: str = Field(description="e.g. DSA, DBMS, HR")
    difficulty: str = Field(description="e.g. Beginner, Intermediate, Advanced")

class StartSessionResponse(BaseModel):
    session_id: str
    first_question: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class Evaluation(BaseModel):
    score: int = Field(description="Score out of 10")
    correctness: str
    completeness: str
    clarity: str
    strengths: str
    weaknesses: str

class ChatResponse(BaseModel):
    evaluation: Evaluation
    next_question: str

class ReportResponse(BaseModel):
    total_score: int
    average_score: float
    weak_areas: str
    strong_areas: str
    summary: str
