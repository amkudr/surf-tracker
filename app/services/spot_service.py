from typing import Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BusinessLogicError

from app.models.spot import Spot


async def create_spot(
    db: AsyncSession,
    name: str,
    lat: Optional[float],
    lon: Optional[float],
    difficulty: Optional[list[int]],
    surf_forecast_name: Optional[str] = None,
) -> Spot:
    spot_model = Spot(
        name=name,
        latitude=lat,
        longitude=lon,
        difficulty=difficulty,
        surf_forecast_name=surf_forecast_name,
    )
    
    db.add(spot_model)
    
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        # Check if it's a unique constraint violation on name
        if 'ix_spots_name' in error_msg or 'unique constraint' in error_msg.lower():
            raise BusinessLogicError("Spot name already exists", code="SPOT_NAME_EXISTS")
        # Check if it's the difficulty constraint violation
        elif 'ck_spots_difficulty_adjacent' in error_msg:
            raise BusinessLogicError(
                "Difficulty levels must be consecutive and in ascending order (e.g., Beginner-Intermediate or Intermediate-Advanced-Expert)",
                code="INVALID_DIFFICULTY_SEQUENCE"
            )
        else:
            # Generic integrity error
            raise BusinessLogicError("Failed to create spot due to data validation error", code="DATA_INTEGRITY_ERROR")
    
    await db.refresh(spot_model)
    return spot_model


async def get_spot_by_id(
    db: AsyncSession,
    spot_id: int,
) -> Optional[Spot]:
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    return result.scalars().first()


async def list_spots(db: AsyncSession) -> list[Spot]:
    result = await db.execute(select(Spot))
    return result.scalars().all()


async def get_spot_by_name(
    db: AsyncSession,
    name: str,
) -> Optional[Spot]:
    result = await db.execute(select(Spot).where(Spot.name == name))
    return result.scalars().first()
