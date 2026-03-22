"""Tests for the cleanup_stale_forecasts worker job."""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.surf_forecast import SurfForecast
from app.models.tide import Tide


class _FakeSessionCtx:
    """Async context manager that yields the given db session without closing it."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def __aenter__(self):
        return self._db

    async def __aexit__(self, *args):
        pass


@pytest_asyncio.fixture
async def forecast_and_tide_data(test_db: AsyncSession, test_spots):
    """Create a mix of old and recent SurfForecast + Tide rows."""
    now = datetime.utcnow()
    old_ts = now - timedelta(days=10)    # older than default 7-day retention
    recent_ts = now - timedelta(days=2)  # within retention window

    old_forecast = SurfForecast(
        spot_id=test_spots[0].id,
        timestamp=old_ts,
        wave_height=1.0,
        period=8.0,
        updated_at=old_ts,
    )
    recent_forecast = SurfForecast(
        spot_id=test_spots[0].id,
        timestamp=recent_ts,
        wave_height=1.5,
        period=9.0,
        updated_at=recent_ts,
    )
    old_tide = Tide(
        spot_id=test_spots[0].id,
        timestamp=old_ts,
        height=0.8,
        tide_type="HIGH",
    )
    recent_tide = Tide(
        spot_id=test_spots[0].id,
        timestamp=recent_ts,
        height=1.2,
        tide_type="LOW",
    )

    test_db.add_all([old_forecast, recent_forecast, old_tide, recent_tide])
    await test_db.commit()

    return {
        "old_forecast": old_forecast,
        "recent_forecast": recent_forecast,
        "old_tide": old_tide,
        "recent_tide": recent_tide,
    }


@pytest.mark.asyncio
async def test_cleanup_deletes_old_forecasts_and_tides(
    test_db: AsyncSession,
    test_spots,
    forecast_and_tide_data,
):
    """Old rows (>7 days) are deleted; recent rows remain."""
    from app.worker import cleanup_stale_forecasts

    with patch("app.worker.async_session", return_value=_FakeSessionCtx(test_db)):
        await cleanup_stale_forecasts()

    # Verify forecasts
    fc_rows = (await test_db.execute(select(SurfForecast))).scalars().all()
    assert len(fc_rows) == 1
    assert fc_rows[0].wave_height == 1.5  # the recent one

    # Verify tides
    tide_rows = (await test_db.execute(select(Tide))).scalars().all()
    assert len(tide_rows) == 1
    assert tide_rows[0].tide_type == "LOW"  # the recent one


@pytest.mark.asyncio
async def test_cleanup_keeps_all_when_within_retention(
    test_db: AsyncSession,
    test_spots,
):
    """When all rows are within the retention window, nothing is deleted."""
    from app.worker import cleanup_stale_forecasts

    now = datetime.utcnow()
    recent = now - timedelta(days=1)
    test_db.add(
        SurfForecast(
            spot_id=test_spots[0].id,
            timestamp=recent,
            wave_height=2.0,
            period=10.0,
            updated_at=recent,
        )
    )
    test_db.add(
        Tide(
            spot_id=test_spots[0].id,
            timestamp=recent,
            height=0.5,
            tide_type="HIGH",
        )
    )
    await test_db.commit()

    with patch("app.worker.async_session", return_value=_FakeSessionCtx(test_db)):
        await cleanup_stale_forecasts()

    fc_rows = (await test_db.execute(select(SurfForecast))).scalars().all()
    assert len(fc_rows) == 1

    tide_rows = (await test_db.execute(select(Tide))).scalars().all()
    assert len(tide_rows) == 1
