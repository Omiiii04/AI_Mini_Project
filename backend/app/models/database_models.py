from sqlalchemy import Column, Integer, String, Text, DateTime
import datetime
from app.core.db import Base

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
    role = Column(String) # 'user', 'assistant', 'evaluation'
    content = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
