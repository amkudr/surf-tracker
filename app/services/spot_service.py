from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.spot import Spot


async def create_spot(
    db: AsyncSession,
    name: str,
    lat: Optional[float],
    lon: Optional[float],
    difficulty: Optional[list[int]],
) -> Spot:
    spot_model = Spot(
        name=name,
        latitude=lat,
        longitude=lon,
        difficulty=difficulty,
    )
    
    db.add(spot_model)
    
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Spot name already exists"
        )
    
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
