from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surf_forecast import SurfForecast
from app.services.session_forecast_service import get_weather_for_session


@pytest_asyncio.fixture
async def test_surf_forecasts(test_db: AsyncSession, test_spots):
    """Seed SurfForecast rows for spot 1: one in window, one outside."""
    base = datetime(2026, 1, 13, 8, 0, 0)
    rows = [
        SurfForecast(
            spot_id=test_spots[0].id,
            timestamp=base + timedelta(hours=0),
            wave_height=1.2,
            period=7.0,
            wave_direction="NE",
            wind_speed=10.0,
            wind_direction="S",
        ),
        SurfForecast(
            spot_id=test_spots[0].id,
            timestamp=base + timedelta(hours=1),
            wave_height=1.4,
            period=8.0,
            wave_direction="NE",
            wind_speed=12.0,
            wind_direction="SW",
        ),
    ]
    for r in rows:
        test_db.add(r)
    await test_db.commit()
    return rows


@pytest.mark.asyncio
async def test_get_weather_for_session_in_window(
    test_db: AsyncSession, test_spots, test_surf_forecasts
):
    """Forecasts in session window are averaged; direction is most common."""
    start = datetime(2026, 1, 13, 8, 0, 0)
    result = await get_weather_for_session(
        test_db, test_spots[0].id, start, duration_minutes=120
    )
    assert result is not None
    assert result["wave_height_m"] == pytest.approx(1.3)
    assert result["wave_period"] == pytest.approx(7.5)
    assert result["wind_speed_kmh"] == pytest.approx(11.0)
    assert result["wave_dir"] == "NE"
    assert result["wind_dir"] in ("S", "SW")


@pytest.mark.asyncio
async def test_get_weather_for_session_no_forecasts_returns_none(
    test_db: AsyncSession, test_spots
):
    """No SurfForecast rows for spot yields None."""
    start = datetime(2026, 1, 13, 8, 0, 0)
    result = await get_weather_for_session(
        test_db, test_spots[0].id, start, duration_minutes=60
    )
    assert result is None


@pytest.mark.asyncio
async def test_get_weather_for_session_closest_too_far_returns_none(
    test_db: AsyncSession, test_spots, test_surf_forecasts
):
    """Closest forecast beyond max_offset_hours yields None."""
    start = datetime(2026, 1, 20, 12, 0, 0)
    result = await get_weather_for_session(
        test_db, test_spots[0].id, start, duration_minutes=60, max_offset_hours=1
    )
    assert result is None


@pytest.mark.asyncio
async def test_get_weather_for_session_closest_within_offset(
    test_db: AsyncSession, test_spots, test_surf_forecasts
):
    """Single closest forecast within max_offset_hours is used."""
    start = datetime(2026, 1, 13, 14, 0, 0)
    result = await get_weather_for_session(
        test_db, test_spots[0].id, start, duration_minutes=60, max_offset_hours=8
    )
    assert result is not None
    assert result["wave_height_m"] == 1.4
    assert result["wave_period"] == 8.0
    assert result["wave_dir"] == "NE"
    assert result["wind_dir"] == "SW"
