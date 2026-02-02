"""Session weather derived from SurfForecast rows (averaged over session window)."""

from __future__ import annotations

import os
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surf_forecast import SurfForecast

MAX_FORECAST_OFFSET_HOURS = int(os.environ.get("MAX_FORECAST_OFFSET_HOURS", "6"))


def _hours_between(a: datetime, b: datetime) -> float:
    return abs((a - b).total_seconds()) / 3600.0


def _distance_to_window(ts: datetime, start: datetime, end: datetime) -> float:
    if start <= ts <= end:
        return 0.0
    return min(_hours_between(ts, start), _hours_between(ts, end))


def _normalize_direction(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    t = s.strip().upper()
    return t if t else None


def _first_or_most_common_direction(values: list[Optional[str]]) -> Optional[str]:
    non_null = [v for v in values if _normalize_direction(v)]
    if not non_null:
        return None
    normalized = [_normalize_direction(v) for v in non_null]
    (candidate, _) = Counter(normalized).most_common(1)[0]
    return candidate


async def get_weather_for_session(
    db: AsyncSession,
    spot_id: int,
    session_datetime: datetime,
    duration_minutes: int,
    max_offset_hours: Optional[int] = None,
) -> Optional[dict[str, Any]]:
    """
    Build session weather dict from SurfForecast rows for the given spot and time window.
    Uses forecasts whose timestamp falls in [session_datetime, session_datetime + duration].
    If none, uses the single closest forecast if within max_offset_hours; otherwise returns None.
    """
    if max_offset_hours is None:
        max_offset_hours = MAX_FORECAST_OFFSET_HOURS

    start = session_datetime
    end = session_datetime + timedelta(minutes=duration_minutes)

    in_window = await db.execute(
        select(SurfForecast)
        .where(
            SurfForecast.spot_id == spot_id,
            SurfForecast.timestamp >= start,
            SurfForecast.timestamp <= end,
        )
        .order_by(SurfForecast.timestamp)
    )
    rows = list(in_window.scalars().all())

    if not rows:
        all_for_spot = await db.execute(
            select(SurfForecast).where(SurfForecast.spot_id == spot_id)
        )
        candidates = list(all_for_spot.scalars().all())
        if not candidates:
            return None
        closest = min(
            candidates,
            key=lambda r: _distance_to_window(r.timestamp, start, end),
        )
        dist = _distance_to_window(closest.timestamp, start, end)
        if dist > max_offset_hours:
            return None
        rows = [closest]

    wave_heights = [r.wave_height for r in rows if r.wave_height is not None]
    periods = [r.period for r in rows if r.period is not None]
    wind_speeds = [r.wind_speed for r in rows if r.wind_speed is not None]
    energies = [r.energy for r in rows if r.energy is not None]
    ratings = [r.rating for r in rows if r.rating is not None]
    wave_dirs = [r.wave_direction for r in rows]
    wind_dirs = [r.wind_direction for r in rows]

    result: dict[str, Any] = {}
    if wave_heights:
        result["wave_height_m"] = sum(wave_heights) / len(wave_heights)
    if periods:
        result["wave_period"] = sum(periods) / len(periods)
    if wind_speeds:
        result["wind_speed_kmh"] = sum(wind_speeds) / len(wind_speeds)
    if energies:
        result["energy"] = sum(energies) / len(energies)
    if ratings:
        result["rating"] = round(sum(ratings) / len(ratings))
    wd = _first_or_most_common_direction(wave_dirs)
    if wd is not None:
        result["wave_dir"] = wd
    wnd = _first_or_most_common_direction(wind_dirs)
    if wnd is not None:
        result["wind_dir"] = wnd

    return result if result else None
