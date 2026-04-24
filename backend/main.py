from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import json

from database import engine, Base, get_db
import models
import llm_engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/session/start", response_model=models.StartSessionResponse)
def start_session(request: models.StartSessionRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    
    # Store session
    db_session = models.SessionDB(
        id=session_id,
        domain=request.domain,
        difficulty=request.difficulty
    )
    db.add(db_session)
    db.commit()
    
    # Generate first question
    first_q = llm_engine.generate_first_question(request.domain, request.difficulty)
    
    # Store first question from assistant
    msg = models.MessageDB(
        session_id=session_id,
        role="assistant",
        content=first_q
    )
    db.add(msg)
    db.commit()
    
    return models.StartSessionResponse(session_id=session_id, first_question=first_q)

@app.post("/api/session/chat", response_model=models.ChatResponse)
def chat(request: models.ChatRequest, db: Session = Depends(get_db)):
    # Get session
    session = db.query(models.SessionDB).filter(models.SessionDB.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Get history
    messages = db.query(models.MessageDB).filter(models.MessageDB.session_id == request.session_id).order_by(models.MessageDB.created_at).all()
    history = [{"role": m.role, "content": m.content} for m in messages if m.role in ["user", "assistant"]]
    
    result = llm_engine.evaluate_and_next_question(
        domain=session.domain,
        difficulty=session.difficulty,
        history=history,
        user_answer=request.message
    )
    
    # Store user message
    user_msg = models.MessageDB(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    
    # Store evaluation
    eval_msg = models.MessageDB(
        session_id=request.session_id,
        role="evaluation",
        content=json.dumps(result["evaluation"])
    )
    db.add(eval_msg)
    
    # Store assistant's next question
    ast_msg = models.MessageDB(
        session_id=request.session_id,
        role="assistant",
        content=result["next_question"]
    )
    db.add(ast_msg)
    db.commit()
    
    return models.ChatResponse(
        evaluation=result["evaluation"],
        next_question=result["next_question"]
    )

@app.get("/api/session/{session_id}/report", response_model=models.ReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.SessionDB).filter(models.SessionDB.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(models.MessageDB).filter(models.MessageDB.session_id == session_id).order_by(models.MessageDB.created_at).all()
    
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
                
    report = llm_engine.generate_report(session.domain, session.difficulty, history, all_evals)
    
    return models.ReportResponse(**report)
