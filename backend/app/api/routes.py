from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.responses import StreamingResponse
import uuid
import json
import json_repair

from app.core.db import get_db
from app.models.database_models import SessionDB, MessageDB, UserDB
from app.schemas.api_schemas import StartSessionRequest, StartSessionResponse, ChatRequest, ChatResponse, ReportResponse
from app.services.llm_service import LLMService
from app.api.deps import get_current_user
from app.core.logger import get_logger

from app.core.limiter import limiter
from fastapi import Request

router = APIRouter()
logger = get_logger(__name__)

@router.post("/start", response_model=StartSessionResponse)
@limiter.limit("30/hour")
async def start_session(request: Request, payload: StartSessionRequest, db: AsyncSession = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    
    full_domain = f"{payload.domain} (Language: {payload.language})"
    db_session = SessionDB(
        id=session_id,
        user_id=current_user.id,
        domain=full_domain,
        difficulty=payload.difficulty
    )
    db.add(db_session)
    await db.commit()
    
    first_q = await LLMService.generate_first_question(full_domain, payload.difficulty)
    
    msg = MessageDB(
        session_id=session_id,
        role="assistant",
        content=first_q
    )
    db.add(msg)
    await db.commit()
    
    return StartSessionResponse(session_id=session_id, first_question=first_q)

@router.post("/chat")
@limiter.limit("20/minute")
async def chat(request: Request, payload: ChatRequest, db: AsyncSession = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    result = await db.execute(select(SessionDB).filter(SessionDB.id == payload.session_id, SessionDB.user_id == current_user.id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or forbidden")
        
    result_msgs = await db.execute(select(MessageDB).filter(MessageDB.session_id == payload.session_id).order_by(MessageDB.created_at))
    messages = result_msgs.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    # Save the user query to the database before the stream blocks
    user_msg = MessageDB(session_id=payload.session_id, role="user", content=payload.message)
    db.add(user_msg)
    await db.commit()

    async def event_stream():
        full_json = ""
        stream = LLMService.evaluate_and_next_question_stream(
            domain=session.domain,
            difficulty=session.difficulty,
            history=history,
            user_answer=payload.message,
            time_spent=payload.time_spent,
            hints_used=session.hints_used or 0
        )
        
        async for chunk in stream:
            full_json += chunk
            # Package string dynamically bypassing direct string concatenation inside events
            safe_chunk = json.dumps({"chunk": chunk})
            yield f"data: {safe_chunk}\n\n"
            
        try:
            # Use json_repair here so streaming failures resolve smoothly
            result = json_repair.loads(full_json)
            # Create a localized background DB session for this generator
            from app.core.db import SessionLocal
            async with SessionLocal() as bg_db:
                eval_msg = MessageDB(session_id=payload.session_id, role="evaluation", content=json.dumps(result.get("evaluation", {})))
                ast_msg = MessageDB(session_id=payload.session_id, role="assistant", content=result.get("next_question", ""))
                bg_db.add(eval_msg)
                bg_db.add(ast_msg)
                await bg_db.commit()
        except Exception as e:
            logger.error(f"Error persisting stream to storage: {e}")
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/{session_id}/hint")
@limiter.limit("10/minute")
async def get_hint(request: Request, session_id: str, db: AsyncSession = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    result = await db.execute(select(SessionDB).filter(SessionDB.id == session_id, SessionDB.user_id == current_user.id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    result_msgs = await db.execute(select(MessageDB).filter(MessageDB.session_id == session_id).order_by(MessageDB.created_at))
    messages = result_msgs.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    hints_used = session.hints_used or 0
    hint_text = await LLMService.generate_hint(session.domain, session.difficulty, history, hints_used)
    
    session.hints_used = hints_used + 1
    await db.commit()
    
    return {"hint": hint_text, "hints_used": session.hints_used}

@router.get("/{session_id}/report", response_model=ReportResponse)
@limiter.limit("5/minute")
async def get_report(request: Request, session_id: str, db: AsyncSession = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    result = await db.execute(select(SessionDB).filter(SessionDB.id == session_id, SessionDB.user_id == current_user.id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    result_msgs = await db.execute(select(MessageDB).filter(MessageDB.session_id == session_id).order_by(MessageDB.created_at))
    messages = result_msgs.scalars().all()
    
    history = []
    all_evals = []
    for m in messages:
        if m.role in ["user", "assistant"]:
            history.append({"role": m.role, "content": m.content})
        elif m.role == "evaluation":
            try:
                all_evals.append(json.loads(m.content))
            except Exception:
                pass
                
    report = await LLMService.generate_report(session.domain, session.difficulty, history, all_evals)
    
    return ReportResponse(**report)

@router.get("/user/history")
@limiter.limit("30/minute")
async def get_user_history(request: Request, db: AsyncSession = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    result = await db.execute(select(SessionDB).filter(SessionDB.user_id == current_user.id).order_by(SessionDB.created_at.desc()))
    sessions = result.scalars().all()
    results = []
    for s in sessions:
        result_msgs = await db.execute(select(MessageDB).filter(MessageDB.session_id == s.id, MessageDB.role == "evaluation"))
        messages = result_msgs.scalars().all()
        scores = []
        for m in messages:
            try:
                ev = json.loads(m.content)
                if "score" in ev:
                    scores.append(int(ev["score"]))
            except Exception:
                pass
        avg_score = round(sum(scores)/len(scores), 1) if scores else 0
        
        results.append({
            "id": s.id,
            "domain": s.domain,
            "difficulty": s.difficulty,
            "created_at": s.created_at.isoformat(),
            "questions_answered": len(scores),
            "average_score": avg_score,
            "is_completed": len(scores) >= 5
        })
        
    return results
