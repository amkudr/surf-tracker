import pytest
from unittest.mock import ANY


@pytest.mark.asyncio
async def test_create_session(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "date": "2026-01-13",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_session_without_auth(client):
    surf_session = {
        "spot_id": 1,
        "date": "2026-01-13",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = await client.post("/surf_session/", json=surf_session)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.get(f"/surf_session/{1}")

    assert response.status_code == 200
    data = response.json()
    assert data["spot_id"] == 1
    assert "surfboard_id" in data
    assert data["surfboard_id"] is None
    assert data["date"] == "2026-01-13"
    assert data["duration_minutes"] == 120
    assert data["wave_quality"] == 8
    assert data["notes"] == "It was really very good good"
    assert data["id"] == 1
    assert data["user_id"] == 1
    assert data["created_at"] is not None
    assert "spot" in data
    assert data["spot"]["id"] == 1
    assert data["spot"]["name"] == "Fisherman"


@pytest.mark.asyncio
async def test_list_surf_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.get(f"/surf_session/")
    data = response.json()
    assert len(data) == 2
    assert data[0]["spot_id"] == 1
    assert data[1]["spot_id"] == 2
    assert "surfboard_id" in data[0]
    assert "surfboard_id" in data[1]
    assert "spot" in data[0]
    assert "spot" in data[1]
    assert data[0]["spot"]["id"] == 1
    assert data[0]["spot"]["name"] == "Fisherman"
    assert data[1]["spot"]["id"] == 2
    assert data[1]["spot"]["name"] == "Main Point"


@pytest.mark.asyncio
async def test_update_session(authenticated_client, test_surf_sessions):
    update_data = {
        "spot_id": 1,
        "date": "2026-01-13",
        "duration_minutes": 70,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = await authenticated_client.put(f"/surf_session/{1}", json=update_data)
    data = response.json()
    assert data["spot_id"] == 1
    assert data["date"] == "2026-01-13"
    assert data["duration_minutes"] == 70
    assert data["wave_quality"] == 8
    assert data["notes"] == "It was really very good good"
    assert data["id"] == 1
    assert data["user_id"] == 1
    assert data["created_at"] is not None
    assert "spot" in data
    assert data["spot"]["id"] == 1

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.delete(f"/surf_session/{1}")
    assert response.status_code == 204
    response = await authenticated_client.get(f"/surf_session/{1}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_error_404(authenticated_client):
    response = await authenticated_client.get(f"/surf_session/")
    response = await authenticated_client.get("/surf_session/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_session_with_spot_name(authenticated_client, test_surf_sessions):
    """Test creating a session using spot_name instead of spot_id."""
    surf_session = {
        "spot_name": "Fisherman",
        "date": "2026-01-14",
        "duration_minutes": 90,
        "wave_quality": 7,
        "notes": "Created with spot name",
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["spot_id"] == 1
    assert "spot" in data
    assert data["spot"]["name"] == "Fisherman"
    assert data["date"] == "2026-01-14"
    assert data["duration_minutes"] == 90


@pytest.mark.asyncio
async def test_create_session_with_nonexistent_spot_name(authenticated_client):
    """Test creating a session with non-existent spot_name returns 404."""
    surf_session = {
        "spot_name": "Nonexistent Spot",
        "date": "2026-01-14",
        "duration_minutes": 90,
        "wave_quality": 7,
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_session_with_spot_name(authenticated_client, test_surf_sessions):
    """Test updating a session using spot_name instead of spot_id."""
    update_data = {
        "spot_name": "Main Point",
        "date": "2026-01-13",
        "duration_minutes": 80,
        "wave_quality": 9,
        "notes": "Updated with spot name",
    }
    response = await authenticated_client.put(f"/surf_session/{1}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["spot_id"] == 2
    assert "spot" in data
    assert data["spot"]["name"] == "Main Point"
    assert data["duration_minutes"] == 80
