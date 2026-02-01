import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.surf_session import SurfSessionCreate, SurfSessionResponse
from app.schemas.spot import SpotResponse


def test_surf_session_create_with_spot_id_valid():
    """Test SurfSessionCreate with valid spot_id."""
    data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "Great session",
    }
    session = SurfSessionCreate(**data)
    assert session.spot_id == 1
    assert session.spot_name is None
    assert session.datetime == datetime(2026, 1, 13, 8, 0, 0)
    assert session.duration_minutes == 120
    assert session.wave_quality == 8
    assert session.notes == "Great session"


def test_surf_session_create_with_spot_name_valid():
    """Test SurfSessionCreate with valid spot_name."""
    data = {
        "spot_name": "Fisherman",
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "Great session",
    }
    session = SurfSessionCreate(**data)
    assert session.spot_id is None
    assert session.spot_name == "Fisherman"
    assert session.datetime == datetime(2026, 1, 13, 8, 0, 0)


def test_surf_session_create_with_both_spot_id_and_name_invalid():
    """Test SurfSessionCreate fails when both spot_id and spot_name are provided."""
    data = {
        "spot_id": 1,
        "spot_name": "Fisherman",
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)
    
    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]["type"] == "value_error"
    assert "Cannot provide both spot_id and spot_name" in str(errors[0]["msg"])


def test_surf_session_create_with_neither_spot_id_nor_name_invalid():
    """Test SurfSessionCreate fails when neither spot_id nor spot_name is provided."""
    data = {
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)
    
    errors = exc_info.value.errors()
    assert len(errors) == 1
    assert errors[0]["type"] == "value_error"
    assert "Either spot_id or spot_name must be provided" in str(errors[0]["msg"])


def test_surf_session_create_with_invalid_spot_id_zero():
    """Test SurfSessionCreate fails when spot_id is 0."""
    data = {
        "spot_id": 0,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)
    
    errors = exc_info.value.errors()
    assert any(error["type"] == "greater_than" for error in errors)


def test_surf_session_create_with_invalid_spot_id_negative():
    """Test SurfSessionCreate fails when spot_id is negative."""
    data = {
        "spot_id": -1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "wave_quality": 8,
    }
    with pytest.raises(ValidationError) as exc_info:
        SurfSessionCreate(**data)
    
    errors = exc_info.value.errors()
    assert any(error["type"] == "greater_than" for error in errors)


def test_surf_session_response_includes_spot():
    """Test SurfSessionResponse includes nested spot object."""
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
        "wave_quality": 8,
        "notes": "Great session",
        "created_at": "2026-01-13T10:00:00",
        "spot": spot.model_dump(),
    }
    response = SurfSessionResponse(**data)
    assert response.spot_id == 1
    assert isinstance(response.spot, SpotResponse)
    assert response.spot.id == 1
    assert response.spot.name == "Fisherman"


def test_surf_session_response_includes_spot_id():
    """Test SurfSessionResponse still includes spot_id field for backward compatibility."""
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
        "wave_quality": 8,
        "notes": None,
        "created_at": "2026-01-13T10:00:00",
        "spot": spot.model_dump(),
    }
    response = SurfSessionResponse(**data)
    assert response.spot_id == 1
    assert response.spot.id == 1
