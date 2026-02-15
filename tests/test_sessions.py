import pytest


def _review_payload(quality: int = 8) -> dict:
    return {
        "quality": quality,
        "crowded_level": 4,
        "wave_height_index": 7,
        "short_long_index": 6,
        "wind_index": 3,
    }


@pytest.mark.asyncio
async def test_create_session_with_review(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "It was really very good good",
        "review": _review_payload(quality=8),
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["surfboard_id"] is None
    assert data["review"] is not None
    assert data["review"]["quality"] == 8


@pytest.mark.asyncio
async def test_create_session_with_zero_quality_and_wave_height(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "Zero quality and wave height",
        "review": {
            **_review_payload(quality=0),
            "wave_height_index": 0,
        },
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["review"] is not None
    assert data["review"]["quality"] == 0
    assert data["review"]["wave_height_index"] == 0


@pytest.mark.asyncio
async def test_create_session_without_review(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "No review",
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["review"] is None


@pytest.mark.asyncio
async def test_create_session_with_partial_review_is_invalid(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "review": {
            "quality": 8,
        },
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_session_without_auth(client):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "review": _review_payload(quality=8),
    }
    response = await client.post("/surf_session/", json=surf_session)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.get("/surf_session/1")

    assert response.status_code == 200
    data = response.json()
    assert data["spot_id"] == 1
    assert "surfboard_id" in data
    assert data["surfboard_id"] is None
    assert data["datetime"] == "2026-01-13T08:00:00"
    assert data["duration_minutes"] == 120
    assert data["notes"] == "It was really very good good"
    assert data["id"] == 1
    assert data["user_id"] == 1
    assert data["created_at"] is not None
    assert "spot" in data
    assert data["spot"]["id"] == 1
    assert data["spot"]["name"] == "Fisherman"
    assert data["review"] is not None
    assert data["review"]["quality"] == 8


@pytest.mark.asyncio
async def test_list_surf_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.get("/surf_session/")
    data = response.json()
    assert len(data) == 2
    assert data[0]["spot_id"] == 1
    assert data[1]["spot_id"] == 2
    assert data[0]["review"]["quality"] == 8
    assert data[1]["review"]["quality"] == 3
    assert "surfboard_id" in data[0]
    assert "surfboard_id" in data[1]
    assert "spot" in data[0]
    assert "spot" in data[1]
    assert data[0]["spot"]["id"] == 1
    assert data[0]["spot"]["name"] == "Fisherman"
    assert data[1]["spot"]["id"] == 2
    assert data[1]["spot"]["name"] == "Main Point"


@pytest.mark.asyncio
async def test_update_session_with_review(authenticated_client, test_surf_sessions):
    update_data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 70,
        "notes": "It was really very good good",
        "review": _review_payload(quality=9),
    }
    response = await authenticated_client.put("/surf_session/1", json=update_data)
    data = response.json()
    assert data["spot_id"] == 1
    assert data["datetime"] == "2026-01-13T08:00:00"
    assert data["duration_minutes"] == 70
    assert data["notes"] == "It was really very good good"
    assert data["id"] == 1
    assert data["user_id"] == 1
    assert data["created_at"] is not None
    assert "spot" in data
    assert data["spot"]["id"] == 1
    assert data["review"] is not None
    assert data["review"]["quality"] == 9

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_session_without_review_deletes_existing_review(authenticated_client, test_surf_sessions):
    update_data = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 70,
        "notes": "Drop review",
    }
    response = await authenticated_client.put("/surf_session/1", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["review"] is None


@pytest.mark.asyncio
async def test_delete_session(authenticated_client, test_surf_sessions):
    response = await authenticated_client.delete("/surf_session/1")
    assert response.status_code == 204
    response = await authenticated_client.get("/surf_session/1")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_error_404(authenticated_client):
    await authenticated_client.get("/surf_session/")
    response = await authenticated_client.get("/surf_session/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_session_fills_weather_from_forecast(
    authenticated_client, test_spots, test_surf_forecasts
):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 120,
        "notes": "With forecast data",
        "review": _review_payload(quality=8),
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["wave_height_m"] is not None
    assert data["wave_period"] is not None
    assert data["wind_speed_kmh"] is not None
    assert data["wave_dir"] is not None
    assert data["wind_dir"] is not None


@pytest.mark.asyncio
async def test_create_session_with_spot_name(authenticated_client, test_surf_sessions):
    surf_session = {
        "spot_name": "Fisherman",
        "datetime": "2026-01-14T08:00:00",
        "duration_minutes": 90,
        "notes": "Created with spot name",
        "review": _review_payload(quality=7),
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["spot_id"] == 1
    assert "spot" in data
    assert data["spot"]["name"] == "Fisherman"
    assert data["datetime"] == "2026-01-14T08:00:00"
    assert data["duration_minutes"] == 90
    assert data["review"]["quality"] == 7


@pytest.mark.asyncio
async def test_create_session_with_inline_surfboard_one_time(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-15T08:00:00",
        "duration_minutes": 60,
        "surfboard_name": "Borrowed Gun",
        "surfboard_length_ft": 7.0,
        "surfboard_brand": "Rusty",
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["surfboard_id"] is None
    assert data["surfboard_name"] == "Borrowed Gun"
    assert data["surfboard_length_ft"] == 7.0


@pytest.mark.asyncio
async def test_create_session_with_inline_surfboard_saved_to_quiver(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-16T08:00:00",
        "duration_minutes": 75,
        "surfboard_name": "Demo Twin",
        "surfboard_length_ft": 5.8,
        "save_surfboard_to_quiver": True,
        "review": _review_payload(quality=7),
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 201
    data = response.json()
    assert data["surfboard_id"] is not None
    assert data["surfboard_name"] == "Demo Twin"
    assert data["surfboard_length_ft"] == pytest.approx(5.8)


@pytest.mark.asyncio
async def test_create_session_save_to_quiver_requires_length(authenticated_client, test_spots):
    surf_session = {
        "spot_id": 1,
        "datetime": "2026-01-17T08:00:00",
        "duration_minutes": 50,
        "save_surfboard_to_quiver": True,
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 400
    assert "length" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_session_with_nonexistent_spot_name(authenticated_client):
    surf_session = {
        "spot_name": "Nonexistent Spot",
        "datetime": "2026-01-14T08:00:00",
        "duration_minutes": 90,
        "review": _review_payload(quality=7),
    }
    response = await authenticated_client.post("/surf_session/", json=surf_session)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_session_with_spot_name(authenticated_client, test_surf_sessions):
    update_data = {
        "spot_name": "Main Point",
        "datetime": "2026-01-13T08:00:00",
        "duration_minutes": 80,
        "notes": "Updated with spot name",
        "review": _review_payload(quality=9),
    }
    response = await authenticated_client.put("/surf_session/1", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["spot_id"] == 2
    assert "spot" in data
    assert data["spot"]["name"] == "Main Point"
    assert data["duration_minutes"] == 80
    assert data["review"]["quality"] == 9
