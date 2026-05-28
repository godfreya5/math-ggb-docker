import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class SessionStatus(str, enum.Enum):
    active = "active"
    archived = "archived"


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), default="未命名题目")
    image_path = Column(String(500), nullable=True)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.active)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
    graphs = relationship("GgbGraph", back_populates="session", cascade="all, delete-orphan")


class MessageRole(str, enum.Enum):
    user = "user"
    ai = "ai"


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=gen_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, index=True)
    role = Column(SAEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    ggb_commands = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    session = relationship("Session", back_populates="messages")


class GgbGraph(Base):
    __tablename__ = "ggb_graphs"
    id = Column(String, primary_key=True, default=gen_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True)
    commands = Column(JSON, nullable=False)
    image_export = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    session = relationship("Session", back_populates="graphs")
