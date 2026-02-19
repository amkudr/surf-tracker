from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessLogicError
from app.core.security import hash_password
from app.models import User
from app.schemas.user import UserCreate


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user_model = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        is_admin=False,
    )

    db.add(user_model)

    try:
        # Commit and catch duplicates (Atomic operation)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise BusinessLogicError("Email already registered", code="EMAIL_EXISTS") from e

    await db.refresh(user_model)
    return user_model

async def create_admin_user(db: AsyncSession, email: str, password: str) -> User:
    """Create an admin user; caller must ensure authorization for this action."""
    user_model = User(
        email=email,
        hashed_password=hash_password(password),
        is_admin=True,
    )

    db.add(user_model)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise BusinessLogicError("Email already registered", code="EMAIL_EXISTS") from e

    await db.refresh(user_model)
    return user_model


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def get_user(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
