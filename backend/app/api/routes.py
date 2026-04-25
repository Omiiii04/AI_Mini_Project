from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import uuid
import json

from app.core.db import get_db
from app.models.database_models import SessionDB, MessageDB, UserDB
from app.schemas.api_schemas import StartSessionRequest, StartSessionResponse, ChatRequest, ChatResponse, ReportResponse
from app.services.llm_service import LLMService
from app.api.deps import get_current_user
from app.services.llm_service import LLMService

from app.core.limiter import limiter
from fastapi import Request

router = APIRouter()

@router.post("/start", response_model=StartSessionResponse)
@limiter.limit("30/hour")
def start_session(request: Request, payload: StartSessionRequest, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    
    db_session = SessionDB(
        id=session_id,
        user_id=current_user.id,
        domain=payload.domain,
        difficulty=payload.difficulty
    )
    db.add(db_session)
    db.commit()
    
    first_q = LLMService.generate_first_question(payload.domain, payload.difficulty)
    
    msg = MessageDB(
        session_id=session_id,
        role="assistant",
        content=first_q
    )
    db.add(msg)
    db.commit()
    
    return StartSessionResponse(session_id=session_id, first_question=first_q)

@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    session = db.query(SessionDB).filter(SessionDB.id == request.session_id, SessionDB.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or forbidden")
        
    messages = db.query(MessageDB).filter(MessageDB.session_id == request.session_id).order_by(MessageDB.created_at).all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    # Save the user query to the database before the stream blocks
    user_msg = MessageDB(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    def event_stream():
        full_json = ""
        stream = LLMService.evaluate_and_next_question_stream(
            domain=session.domain,
            difficulty=session.difficulty,
            history=history,
            user_answer=request.message,
            time_spent=request.time_spent,
            hints_used=session.hints_used or 0
        )
        
        for chunk in stream:
            full_json += chunk
            # Package string dynamically bypassing direct string concatenation inside events
            safe_chunk = json.dumps({"chunk": chunk})
            yield f"data: {safe_chunk}\n\n"
            
        try:
            result = json.loads(full_json)
            # Create a localized background DB session for this generator
            from app.core.db import SessionLocal
            with SessionLocal() as bg_db:
                eval_msg = MessageDB(session_id=request.session_id, role="evaluation", content=json.dumps(result.get("evaluation", {})))
                ast_msg = MessageDB(session_id=request.session_id, role="assistant", content=result.get("next_question", ""))
                bg_db.add(eval_msg)
                bg_db.add(ast_msg)
                bg_db.commit()
        except Exception as e:
            print(f"Error persisting stream to storage: {e}")
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/{session_id}/hint")
def get_hint(session_id: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    session = db.query(SessionDB).filter(SessionDB.id == session_id, SessionDB.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(MessageDB).filter(MessageDB.session_id == session_id).order_by(MessageDB.created_at).all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    hints_used = session.hints_used or 0
    hint_text = LLMService.generate_hint(session.domain, session.difficulty, history, hints_used)
    
    session.hints_used = hints_used + 1
    db.commit()
    
    return {"hint": hint_text, "hints_used": session.hints_used}

@router.get("/{session_id}/report", response_model=ReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    session = db.query(SessionDB).filter(SessionDB.id == session_id, SessionDB.user_id == current_user.id).first()
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

@router.get("/user/history")
def get_user_history(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    sessions = db.query(SessionDB).filter(SessionDB.user_id == current_user.id).order_by(SessionDB.created_at.desc()).all()
    results = []
    for s in sessions:
        is_completed = s.report_summary is not None
        messages = db.query(MessageDB).filter(MessageDB.session_id == s.id, MessageDB.role == "evaluation").all()
        scores = []
        for m in messages:
            try:
                ev = json.loads(m.content)
                if "score" in ev:
                    scores.append(int(ev["score"]))
            except:
                pass
        avg_score = round(sum(scores)/len(scores), 1) if scores else 0
        
        results.append({
            "id": s.id,
            "domain": s.domain,
            "difficulty": s.difficulty,
            "created_at": s.created_at.isoformat(),
            "questions_answered": len(scores),
            "average_score": avg_score,
            "is_completed": is_completed
        })
        
    return results
