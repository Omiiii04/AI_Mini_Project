from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.db import engine, Base
from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.models.database_models import SessionDB, MessageDB, UserDB  # noqa: F401
from app.core.logger import get_logger

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")
    yield

app = FastAPI(title="AI Interviewer API", lifespan=lifespan)

import os

# Restrict CORS for frontend
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:80,http://localhost:5173,http://localhost:5174,http://localhost,http://127.0.0.1,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:80")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(api_router, prefix="/api/session", tags=["session"])
