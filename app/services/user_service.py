from typing import Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BusinessLogicError

from app.models import User
from app.schemas.user import UserCreate 
from app.core.security import hash_password

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user_model = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
    )

    db.add(user_model)
    
    try:
        #Commit and catch duplicates (Atomic operation)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise BusinessLogicError("Email already registered", code="EMAIL_EXISTS")
        
    await db.refresh(user_model)
    return user_model

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
