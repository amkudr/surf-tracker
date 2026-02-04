"""Session weather derived from SurfForecast rows (averaged over session window)."""

from __future__ import annotations

import math
import os
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surf_forecast import SurfForecast
from app.models.tide import Tide

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

    # Add tide data
    tide_data = await get_tide_for_session(db, spot_id, session_datetime)
    if tide_data:
        result.update(tide_data)

    return result if result else None


async def get_tide_for_session(
    db: AsyncSession,
    spot_id: int,
    session_datetime: datetime,
) -> Optional[dict[str, Any]]:
    """
    Find surrounding low/high tides and interpolate actual height at session_datetime.
    Uses cosine interpolation: h(t) = h_low + (h_high - h_low) * (1 - cos(pi * (t - t_low) / (t_high - t_low))) / 2
    """
    # Fetch tides for the spot within +/- 12 hours to ensure we get bounding High and Low
    window_start = session_datetime - timedelta(hours=12)
    window_end = session_datetime + timedelta(hours=12)

    result = await db.execute(
        select(Tide)
        .where(
            Tide.spot_id == spot_id,
            Tide.timestamp >= window_start,
            Tide.timestamp <= window_end,
        )
        .order_by(Tide.timestamp)
    )
    tides = list(result.scalars().all())

    if len(tides) < 2:
        return None

    # Find bounding tides
    prev_tide = None
    next_tide = None
    for i in range(len(tides) - 1):
        if tides[i].timestamp <= session_datetime <= tides[i+1].timestamp:
            prev_tide = tides[i]
            next_tide = tides[i+1]
            break

    if not prev_tide or not next_tide:
        return None

    # Identify which is High and which is Low (or just use their heights)
    h1, h2 = prev_tide.height, next_tide.height
    t1, t2 = prev_tide.timestamp, next_tide.timestamp
    
    # Cosine interpolation
    dt_total = (t2 - t1).total_seconds()
    if dt_total == 0:
        interpolated_height = h1
    else:
        dt_segment = (session_datetime - t1).total_seconds()
        # Progress from 0 to 1
        fraction = dt_segment / dt_total
        # Cosine curve from 0 to 1: (1 - cos(pi * fraction)) / 2
        formula_fraction = (1 - math.cos(math.pi * fraction)) / 2
        interpolated_height = h1 + (h2 - h1) * formula_fraction

    # Determine tide_low and tide_high from the bounding pair
    # Note: Sometimes we might have two Highs or two Lows if scraping is weird, 
    # but usually it's one of each.
    tide_low = min(h1, h2)
    tide_high = max(h1, h2)

    return {
        "tide_height_m": round(interpolated_height, 2),
        "tide_low_m": tide_low,
        "tide_high_m": tide_high,
    }
