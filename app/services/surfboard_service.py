from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surfboard import Surfboard
from app.schemas.surfboard import SurfboardCreate, SurfboardUpdate


def _maybe_compute_volume_liters(
    length_ft: float | None, width_in: float | None, thickness_in: float | None
) -> float | None:
    """Approximate volume in liters if dimensions are provided.

    Uses a shape coefficient to roughly model the curved outline of a surfboard.
    The coefficient (0.54) is a common rule of thumb for shortboards.
    """
    if length_ft is None or width_in is None or thickness_in is None:
        return None
    cubic_inches = (length_ft * 12) * width_in * thickness_in * 0.54
    return cubic_inches * 0.0163871  # in^3 to liters


async def create_surfboard(
    db: AsyncSession, surfboard_create: SurfboardCreate, owner_id: int
) -> Surfboard:
    volume = (
        surfboard_create.volume_liters
        if surfboard_create.volume_liters is not None
        else _maybe_compute_volume_liters(
            surfboard_create.length_ft,
            surfboard_create.width_in,
            surfboard_create.thickness_in,
        )
    )
    surfboard_model = Surfboard(
        name=surfboard_create.name,
        brand=surfboard_create.brand,
        model=surfboard_create.model,
        length_ft=surfboard_create.length_ft,
        width_in=surfboard_create.width_in,
        thickness_in=surfboard_create.thickness_in,
        volume_liters=volume,
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

    # If volume not provided and still unknown, backfill from dimensions.
    if "volume_liters" not in update_data and surfboard_model.volume_liters is None:
        maybe_volume = _maybe_compute_volume_liters(
            surfboard_model.length_ft,
            surfboard_model.width_in,
            surfboard_model.thickness_in,
        )
        if maybe_volume is not None:
            surfboard_model.volume_liters = maybe_volume

    await db.commit()
    await db.refresh(surfboard_model)
    return surfboard_model

async def delete_surfboard(db: AsyncSession, surfboard_id: int, owner_id: int) -> bool:
    result = await db.execute(delete(Surfboard).where(Surfboard.id == surfboard_id, Surfboard.owner_id == owner_id))
    await db.commit()
    return result.rowcount > 0

