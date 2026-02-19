from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tide import Tide
from app.services.session_forecast_service import get_tide_for_session


@pytest.mark.asyncio
async def test_tide_interpolation(test_db: AsyncSession, test_spots):
    spot_id = test_spots[0].id

    # Seed tides: Low at 06:00 (1.0m) and High at 12:00 (3.0m)
    tides = [
        Tide(spot_id=spot_id, timestamp=datetime(2026, 2, 4, 6, 0), height=1.0, tide_type="LOW"),
        Tide(spot_id=spot_id, timestamp=datetime(2026, 2, 4, 12, 0), height=3.0, tide_type="HIGH"),
    ]
    for t in tides:
        test_db.add(t)
    await test_db.commit()

    # Test at midpoint (09:00)
    # Cosine interpolation at midpoint (fraction=0.5) should be (h1+h2)/2 = 2.0
    res = await get_tide_for_session(test_db, spot_id, datetime(2026, 2, 4, 9, 0))
    assert res is not None
    assert res["tide_height_m"] == 2.0
    assert res["tide_low_m"] == 1.0
    assert res["tide_high_m"] == 3.0

    # Test near Low (07:00, fraction=1/6)
    # (1 - cos(pi/6))/2 = (1 - 0.866)/2 = 0.067
    # 1.0 + (3.0 - 1.0) * 0.067 = 1.134
    res = await get_tide_for_session(test_db, spot_id, datetime(2026, 2, 4, 7, 0))
    assert res is not None
    assert 1.1 <= res["tide_height_m"] <= 1.2

    # Test near High (11:00, fraction=5/6)
    # (1 - cos(5pi/6))/2 = (1 - (-0.866))/2 = 0.933
    # 1.0 + 2.0 * 0.933 = 2.866
    res = await get_tide_for_session(test_db, spot_id, datetime(2026, 2, 4, 11, 0))
    assert res is not None
    assert 2.8 <= res["tide_height_m"] <= 2.9
