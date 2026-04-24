from pydantic import BaseModel, Field

class StartSessionRequest(BaseModel):
    domain: str = Field(description="e.g. Data Structures & Algorithms, DBMS, HR")
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
