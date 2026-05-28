from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SessionCreate(BaseModel):
    title: Optional[str] = "未命名题目"

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    image_path: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

class ChatRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    ggb_commands: Optional[List[str]]
    created_at: datetime

class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    reply: str
    ggb_commands: Optional[List[str]]
    message: MessageResponse
