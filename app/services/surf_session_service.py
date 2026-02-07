from typing import Optional

from fastapi import status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessLogicError

from app.models import SurfSession
from app.schemas.surf_session import SurfSessionCreate
from app.services.session_forecast_service import get_weather_for_session
from app.services.spot_service import get_spot_by_name
from app.schemas.surfboard import SurfboardCreate
from app.services.surfboard_service import create_surfboard


async def _resolve_spot_name_to_id(db: AsyncSession, session_data: dict) -> None:

    spot_name = session_data.pop('spot_name', None)
    if spot_name is None:
        return

    spot = await get_spot_by_name(db, spot_name)
    if spot is None:
        raise BusinessLogicError(f"Spot '{spot_name}' not found", code="SPOT_NOT_FOUND", status_code=status.HTTP_404_NOT_FOUND)
    session_data['spot_id'] = spot.id


async def _maybe_create_quiver_surfboard(
    db: AsyncSession, session_data: dict, user_id: int
) -> None:
    """Create a surfboard owned by the user when requested and attach its id."""
    should_save = bool(session_data.pop("save_surfboard_to_quiver", False))
    # If user selected an existing board, nothing to do.
    if session_data.get("surfboard_id") is not None or not should_save:
        return

    length_ft = session_data.get("surfboard_length_ft")
    if length_ft is None:
        raise BusinessLogicError(
            "Length (ft) is required to save this surfboard to your quiver",
            code="SURFBOARD_LENGTH_REQUIRED",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    surfboard = await create_surfboard(
        db,
        SurfboardCreate(
            name=session_data.get("surfboard_name"),
            brand=session_data.get("surfboard_brand"),
            model=session_data.get("surfboard_model"),
            length_ft=length_ft,
            width_in=session_data.get("surfboard_width_in"),
            thickness_in=session_data.get("surfboard_thickness_in"),
            volume_liters=session_data.get("surfboard_volume_liters"),
        ),
        owner_id=user_id,
    )
    session_data["surfboard_id"] = surfboard.id


async def create_surf_session(
    db: AsyncSession,
    surf_session_data: dict,
    user_id: int,
) -> SurfSession:

    await _resolve_spot_name_to_id(db, surf_session_data)
    await _maybe_create_quiver_surfboard(db, surf_session_data, user_id)

    weather_data: dict = {}
    spot_id = surf_session_data.get("spot_id")
    if spot_id is not None:
        session_weather = await get_weather_for_session(
            db,
            spot_id,
            surf_session_data["datetime"],
            surf_session_data["duration_minutes"],
        )
        if session_weather:
            weather_data = session_weather

    surf_session_model = SurfSession(
        **surf_session_data,
        **weather_data,
        user_id=user_id,
    )
    db.add(surf_session_model)
    await db.commit()
    await db.refresh(surf_session_model)
    
    result = await db.execute(
        select(SurfSession)
        .options(selectinload(SurfSession.spot), selectinload(SurfSession.surfboard))
        .where(SurfSession.id == surf_session_model.id)
    )
    return result.scalars().first()


async def get_surf_session(
    db: AsyncSession,
    surf_session_id: int,
    user_id: int,
) -> Optional[SurfSession]:

    result = await db.execute(
        select(SurfSession)
        .options(selectinload(SurfSession.spot), selectinload(SurfSession.surfboard))
        .where(
            SurfSession.id == surf_session_id,
            SurfSession.user_id == user_id,
        )
    )
    return result.scalars().first()


async def list_surf_sessions(
    db: AsyncSession,
    user_id: int,
) -> list[SurfSession]:

    result = await db.execute(
        select(SurfSession)
        .options(selectinload(SurfSession.spot), selectinload(SurfSession.surfboard))
        .where(SurfSession.user_id == user_id)
    )
    return result.scalars().all()


async def update_surf_session(
    db: AsyncSession,
    surf_session_id: int,
    user_id: int,
    update_data: SurfSessionCreate,
) -> Optional[SurfSession]:

    surf_session_model = await get_surf_session(db, surf_session_id, user_id)
    if surf_session_model is None:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)
    weather_keys = {"spot_id", "datetime", "duration_minutes"}
    weather_relevant_changed = bool(weather_keys & set(update_dict.keys()))

    await _resolve_spot_name_to_id(db, update_dict)
    await _maybe_create_quiver_surfboard(db, update_dict, user_id)

    for field, value in update_dict.items():
        setattr(surf_session_model, field, value)

    if weather_relevant_changed and surf_session_model.spot_id is not None:
        session_weather = await get_weather_for_session(
            db,
            surf_session_model.spot_id,
            surf_session_model.datetime,
            surf_session_model.duration_minutes,
        )
        for key in ("wave_height_m", "wave_period", "wave_dir", "wind_speed_kmh", "wind_dir", "energy", "rating", "tide_height_m", "tide_low_m", "tide_high_m"):
            setattr(surf_session_model, key, session_weather.get(key) if session_weather else None)

    await db.commit()
    await db.refresh(surf_session_model)
    
    result = await db.execute(
        select(SurfSession)
        .options(selectinload(SurfSession.spot), selectinload(SurfSession.surfboard))
        .where(SurfSession.id == surf_session_model.id)
    )
    return result.scalars().first()


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
