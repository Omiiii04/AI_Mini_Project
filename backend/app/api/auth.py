from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.db import get_db
from app.core import security
from app.models.database_models import UserDB
from pydantic import BaseModel
from app.core.limiter import limiter
from fastapi import Request

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str

@router.post("/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserDB).filter(UserDB.username == user.username))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pass = security.get_password_hash(user.password)
    new_user = UserDB(username=user.username, hashed_password=hashed_pass)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = security.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserDB).filter(UserDB.username == form_data.username))
    user = result.scalars().first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = security.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
