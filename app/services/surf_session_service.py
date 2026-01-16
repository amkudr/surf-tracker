from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SurfSession


async def create_surf_session(
    db: AsyncSession,
    surf_session_data: dict,
    user_id: int,
) -> SurfSession:

    surf_session_model = SurfSession(
        **surf_session_data,
        user_id=user_id,
    )
    db.add(surf_session_model)
    await db.commit()
    await db.refresh(surf_session_model)
    return surf_session_model


async def get_surf_session(
    db: AsyncSession,
    surf_session_id: int,
    user_id: int,
) -> Optional[SurfSession]:

    result = await db.execute(
        select(SurfSession).where(
            SurfSession.id == surf_session_id,
            SurfSession.user_id == user_id,
        )
    )
    return result.scalars().first()


async def list_surf_sessions(
    db: AsyncSession,
    user_id: int,
) -> list[SurfSession]:

    result = await db.execute(select(SurfSession).where(SurfSession.user_id == user_id))
    return result.scalars().all()


async def update_surf_session(
    db: AsyncSession,
    surf_session_id: int,
    user_id: int,
    update_data,
) -> Optional[SurfSession]:

    surf_session_model = await get_surf_session(db, surf_session_id, user_id)
    if surf_session_model is None:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(surf_session_model, field, value)

    await db.commit()
    await db.refresh(surf_session_model)
    return surf_session_model


async def delete_surf_session(
    db: AsyncSession,
    surf_session_id: int,
    user_id: int,
) -> bool:

    result = await db.execute(
        delete(SurfSession).where(
            SurfSession.id == surf_session_id,
            SurfSession.user_id == user_id,
        )
    )
    await db.commit()
    return result.rowcount > 0
