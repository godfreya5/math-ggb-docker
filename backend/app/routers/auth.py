from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth import hash_password, verify_password, create_token

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where((User.email == data.email) | (User.username == data.username)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already exists")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
