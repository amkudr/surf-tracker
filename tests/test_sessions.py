import pytest
from unittest.mock import ANY


@pytest.mark.asyncio
async def test_create_session(authenticated_client):
    surf_session = {
        "spot": "Plantations",
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
        "spot": "Plantations",
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
    assert response.json() == {
        "spot": "Fisherman",
        "date": "2026-01-13",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "It was really very good good",
        "id": 1,
        "user_id": 1,
        "created_at": ANY,
    }


@pytest.mark.asyncio
async def test_list_surf_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.get(f"/surf_session/")
    data = response.json()
    assert len(data) == 2
    assert data[0]["spot"] == "Fisherman"
    assert data[1]["spot"] == "Main Point"


@pytest.mark.asyncio
async def test_update_session(authenticated_client, test_surf_sessions):
    update_data = {
        "spot": "Fisherman",
        "date": "2026-01-13",
        "duration_minutes": 70,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = await authenticated_client.put(f"/surf_session/{1}", json=update_data)
    assert response.json() == {
        "spot": "Fisherman",
        "date": "2026-01-13",
        "duration_minutes": 70,
        "wave_quality": 8,
        "notes": "It was really very good good",
        "id": 1,
        "user_id": 1,
        "created_at": ANY,
    }

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
