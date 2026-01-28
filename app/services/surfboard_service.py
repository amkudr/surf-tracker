from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surfboard import Surfboard
from app.schemas.surfboard import SurfboardCreate, SurfboardUpdate


async def create_surfboard(db: AsyncSession, surfboard_create: SurfboardCreate, owner_id: int) -> Surfboard:
    surfboard_model = Surfboard(
        name=surfboard_create.name,
        brand=surfboard_create.brand,
        model=surfboard_create.model,
        length_ft=surfboard_create.length_ft,
        volume_liters=surfboard_create.volume_liters,
        owner_id=owner_id,
    )
    db.add(surfboard_model)
    await db.commit()
    await db.refresh(surfboard_model)
    return surfboard_model


async def get_surfboard_by_id(db: AsyncSession, surfboard_id: int) -> Surfboard | None:
    result = await db.execute(select(Surfboard).where(Surfboard.id == surfboard_id))
    return result.scalar_one_or_none()

async def get_surfboards_by_owner_id(db: AsyncSession, owner_id: int) -> list[Surfboard]:
    result = await db.execute(select(Surfboard).where(Surfboard.owner_id == owner_id))
    return result.scalars().all()

async def update_surfboard(
    db: AsyncSession,
    surfboard_id: int,
    surfboard_update: SurfboardUpdate,
) -> Surfboard | None:
    surfboard_model = await get_surfboard_by_id(db, surfboard_id)
    if surfboard_model is None:
        return None

    update_data = surfboard_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(surfboard_model, field, value)

    await db.commit()
    await db.refresh(surfboard_model)
    return surfboard_model

async def delete_surfboard(db: AsyncSession, surfboard_id: int, owner_id: int) -> bool:
    result = await db.execute(delete(Surfboard).where(Surfboard.id == surfboard_id, Surfboard.owner_id == owner_id))
    await db.commit()
    return result.rowcount > 0
    
    