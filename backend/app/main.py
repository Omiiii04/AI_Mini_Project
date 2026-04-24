from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import engine, Base
from app.api.routes import router as api_router
from app.models.database_models import SessionDB, MessageDB

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interviewer API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/session")
