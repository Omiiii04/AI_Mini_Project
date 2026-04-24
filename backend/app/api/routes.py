from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json

from app.core.db import get_db
from app.models.database_models import SessionDB, MessageDB
from app.schemas.api_schemas import StartSessionRequest, StartSessionResponse, ChatRequest, ChatResponse, ReportResponse
from app.services.llm_service import LLMService

router = APIRouter()

@router.post("/start", response_model=StartSessionResponse)
def start_session(request: StartSessionRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    
    db_session = SessionDB(
        id=session_id,
        domain=request.domain,
        difficulty=request.difficulty
    )
    db.add(db_session)
    db.commit()
    
    first_q = LLMService.generate_first_question(request.domain, request.difficulty)
    
    msg = MessageDB(
        session_id=session_id,
        role="assistant",
        content=first_q
    )
    db.add(msg)
    db.commit()
    
    return StartSessionResponse(session_id=session_id, first_question=first_q)

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    session = db.query(SessionDB).filter(SessionDB.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(MessageDB).filter(MessageDB.session_id == request.session_id).order_by(MessageDB.created_at).all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    result = LLMService.evaluate_and_next_question(
        domain=session.domain,
        difficulty=session.difficulty,
        history=history,
        user_answer=request.message
    )
    
    user_msg = MessageDB(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    
    eval_msg = MessageDB(
        session_id=request.session_id,
        role="evaluation",
        content=json.dumps(result["evaluation"])
    )
    db.add(eval_msg)
    
    ast_msg = MessageDB(
        session_id=request.session_id,
        role="assistant",
        content=result["next_question"]
    )
    db.add(ast_msg)
    db.commit()
    
    return ChatResponse(
        evaluation=result["evaluation"],
        next_question=result["next_question"]
    )

@router.get("/{session_id}/report", response_model=ReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(MessageDB).filter(MessageDB.session_id == session_id).order_by(MessageDB.created_at).all()
    
    history = []
    all_evals = []
    for m in messages:
        if m.role in ["user", "assistant"]:
            history.append({"role": m.role, "content": m.content})
        elif m.role == "evaluation":
            try:
                all_evals.append(json.loads(m.content))
            except:
                pass
                
    report = LLMService.generate_report(session.domain, session.difficulty, history, all_evals)
    
    return ReportResponse(**report)
