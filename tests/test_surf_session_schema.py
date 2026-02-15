from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.spot import SpotResponse
from app.schemas.surf_session import SurfSessionCreate, SurfSessionResponse


def _review_payload() -> dict:
    return {
        "quality": 8,
        "crowded_level": 4,
        "wave_height_index": 7,
        "short_long_index": 6,
        "wind_index": 3,
    }


def test_surf_session_create_with_spot_id_valid():
    data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "Great session",
        "review": _review_payload(),
    }
    session = SurfSessionCreate(**data)
    assert session.spot_id == 1
    assert session.spot_name is None
    assert session.datetime == datetime(2026, 1, 13, 8, 0, 0)
    assert session.duration_minutes == 120
    assert session.review is not None
    assert session.review.quality == 8


def test_surf_session_create_with_spot_name_valid_without_review():
    data = {
        "spot_name": "Fisherman",
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "Great session",
    }
    session = SurfSessionCreate(**data)
    assert session.spot_id is None
    assert session.spot_name == "Fisherman"
    assert session.datetime == datetime(2026, 1, 13, 8, 0, 0)
    assert session.review is None


def test_surf_session_create_with_partial_review_is_invalid():
    data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "review": {
            "quality": 8,
        },
    }
    with pytest.raises(ValidationError):
        SurfSessionCreate(**data)


def test_surf_session_create_with_zero_quality_and_wave_height_is_valid():
    data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "review": {
            "quality": 0,
            "crowded_level": 4,
            "wave_height_index": 0,
            "short_long_index": 6,
            "wind_index": 3,
        },
    }
    session = SurfSessionCreate(**data)
    assert session.review is not None
    assert session.review.quality == 0
    assert session.review.wave_height_index == 0


def test_surf_session_create_with_both_spot_id_and_name_invalid():
    data = {
        "spot_id": 1,
        "spot_name": "Fisherman",
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)

    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]["type"] == "value_error"
    assert "Cannot provide both spot_id and spot_name" in str(errors[0]["msg"])


def test_surf_session_create_with_neither_spot_id_nor_name_invalid():
    data = {
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)

    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]["type"] == "value_error"
    assert "Either spot_id or spot_name must be provided" in str(errors[0]["msg"])


def test_surf_session_create_with_invalid_spot_id_zero():
    data = {
        "spot_id": 0,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)

    errors = exc_info.value.errors()
    assert any(error["type"] == "greater_than" for error in errors)


def test_surf_session_create_with_invalid_spot_id_negative():
    data = {
        "spot_id": -1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)

    errors = exc_info.value.errors()
    assert any(error["type"] == "greater_than" for error in errors)


def test_surf_session_response_includes_spot_and_review():
    spot = SpotResponse(
        id=1,
        name="Fisherman",
        latitude=None,
        longitude=None,
        difficulty=None,
    )
    data = {
        "id": 1,
        "spot_id": 1,
        "surfboard_id": None,
        "user_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "Great session",
        "created_at": "2026-01-13T10:00:00",
        "spot": spot.model_dump(),
        "review": {
            "id": 11,
            "surf_session_id": 1,
            "spot_id": 1,
            "observed_at": "2026-01-13T08:00:00",
            "quality": 8,
            "crowded_level": 4,
            "wave_height_index": 7,
            "short_long_index": 6,
            "wind_index": 3,
            "created_at": "2026-01-13T10:00:00",
        },
    }
    response = SurfSessionResponse(**data)
    assert response.spot_id == 1
    assert isinstance(response.spot, SpotResponse)
    assert response.spot.id == 1
    assert response.spot.name == "Fisherman"
    assert response.review is not None
    assert response.review.quality == 8


def test_surf_session_response_can_have_no_review():
    spot = SpotResponse(
        id=1,
        name="Fisherman",
        latitude=None,
        longitude=None,
        difficulty=None,
    )
    data = {
        "id": 1,
        "spot_id": 1,
        "surfboard_id": None,
        "user_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": None,
        "created_at": "2026-01-13T10:00:00",
        "spot": spot.model_dump(),
        "review": None,
    }
    response = SurfSessionResponse(**data)
    assert response.spot_id == 1
    assert response.spot.id == 1
    assert response.review is None
