from typing import Optional

from fastapi import status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessLogicError, ExternalAPIError

from app.models import SurfSession
from app.schemas.surf_session import SurfSessionCreate
from app.services.spot_service import get_spot_by_id, get_spot_by_name
from app.services.weather_service import get_surf_report


async def _resolve_spot_name_to_id(db: AsyncSession, session_data: dict) -> None:

    spot_name = session_data.pop('spot_name', None)
    if spot_name is None:
        return

    spot = await get_spot_by_name(db, spot_name)
    if spot is None:
        raise BusinessLogicError(f"Spot '{spot_name}' not found", code="SPOT_NOT_FOUND", status_code=status.HTTP_404_NOT_FOUND)
    session_data['spot_id'] = spot.id


async def create_surf_session(
    db: AsyncSession,
    surf_session_data: dict,
    user_id: int,
) -> SurfSession:

    await _resolve_spot_name_to_id(db, surf_session_data)

    # Fetch weather data if spot has coordinates
    weather_data = {}
    spot_id = surf_session_data.get('spot_id')
    if spot_id is not None:
        spot = await get_spot_by_id(db, spot_id)
        if spot and spot.latitude is not None and spot.longitude is not None:
            try:
                surf_report = await get_surf_report(
                    lat=spot.latitude,
                    lon=spot.longitude,
                    target_date=surf_session_data["datetime"],
                    timezone="Asia/Colombo"
                )
                if surf_report:
                    weather_data = {
                        'wave_height_m': surf_report.get('wave_height'),
                        'wave_period': surf_report.get('wave_period'),
                        'wave_dir': surf_report.get('wave_direction'),
                        'wind_speed_kmh': surf_report.get('wind_speed'),
                        'wind_dir': surf_report.get('wind_direction'),
                    }
            except ExternalAPIError:
                # Graceful degradation: continue without weather data if API fails
                pass

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
        .options(selectinload(SurfSession.spot))
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
        .options(selectinload(SurfSession.spot))
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
        .options(selectinload(SurfSession.spot))
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
    
    await _resolve_spot_name_to_id(db, update_dict)
    
    for field, value in update_dict.items():
        setattr(surf_session_model, field, value)

    await db.commit()
    await db.refresh(surf_session_model)
    
    result = await db.execute(
        select(SurfSession)
        .options(selectinload(SurfSession.spot))
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
