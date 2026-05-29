import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Session, Message, MessageRole, GgbGraph
from app.schemas import ChatRequest, ChatResponse, MessageResponse
from app.middleware.auth import get_current_user
from app.services.llm import get_llm
from app.services.ggb import extract_ggb_commands
from app.config import settings

router = APIRouter()

@router.post("/{session_id}/upload")
async def upload_image(
    session_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    session.image_path = filepath
    await db.commit()
    return {"image_path": f"/uploads/{filename}", "filename": filename}

@router.post("/{session_id}/chat", response_model=ChatResponse)
async def chat(
    session_id: str,
    data: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build conversation context from history
    msg_result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at)
    )
    history = msg_result.scalars().all()
    llm_messages = [{"role": m.role.value if isinstance(m.role, MessageRole) else m.role, "content": m.content} for m in history]
    llm_messages.append({"role": "user", "content": data.message})

    # Save user message
    user_msg = Message(session_id=session_id, role=MessageRole.user, content=data.message)
    db.add(user_msg)
    await db.commit()

    # Call LLM
    llm = get_llm()
    try:
        response = await llm.chat(llm_messages, image_path=session.image_path)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Extract GGB commands
    ggb_commands = extract_ggb_commands(response.content)

    # Save AI message
    ai_msg = Message(
        session_id=session_id,
        role=MessageRole.ai,
        content=response.content,
        ggb_commands=ggb_commands,
    )
    db.add(ai_msg)

    # Save GGB graph record if commands exist
    if ggb_commands:
        graph = GgbGraph(session_id=session_id, message_id=ai_msg.id, commands=ggb_commands)
        db.add(graph)

    await db.commit()
    await db.refresh(ai_msg)

    return ChatResponse(
        reply=response.content,
        ggb_commands=ggb_commands,
        message=MessageResponse.model_validate(ai_msg),
    )

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at)
    )
    return [MessageResponse.model_validate(m) for m in result.scalars().all()]
