import pytest
from datetime import UTC, datetime


def _review_payload(quality: int) -> dict:
    return {
        "quality": quality,
        "crowded_level": 4,
        "wave_height_index": 7,
        "short_long_index": 6,
        "wind_index": 3,
    }


async def _login_token(client, email: str, password: str) -> str:
    response = await client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_spot_review_endpoints_require_auth(client, test_spots):
    list_response = await client.get("/spot/")
    assert list_response.status_code == 401

    get_response = await client.get(f"/spot/{test_spots[0].id}")
    assert get_response.status_code == 401

    reviews_response = await client.get(f"/spot/{test_spots[0].id}/reviews")
    assert reviews_response.status_code == 401


@pytest.mark.asyncio
async def test_spot_reviews_are_visible_across_users_and_anonymous(client, test_user, test_spots):
    register_response = await client.post(
        "/auth/register",
        json={"email": "other@example.com", "password": "testpassword123"},
    )
    assert register_response.status_code == 201

    user_1_token = await _login_token(client, test_user.email, "testpassword123")
    user_2_token = await _login_token(client, "other@example.com", "testpassword123")

    today_utc = datetime.now(UTC).date().isoformat()

    session_1_response = await client.post(
        "/surf_session/",
        json={
            "spot_id": test_spots[0].id,
            "datetime": f"{today_utc}T08:00:00",
            "duration_minutes": 90,
            "review": _review_payload(quality=8),
        },
        headers={"Authorization": f"Bearer {user_1_token}"},
    )
    assert session_1_response.status_code == 201

    session_2_response = await client.post(
        "/surf_session/",
        json={
            "spot_id": test_spots[0].id,
            "datetime": f"{today_utc}T09:00:00",
            "duration_minutes": 60,
            "review": _review_payload(quality=5),
        },
        headers={"Authorization": f"Bearer {user_2_token}"},
    )
    assert session_2_response.status_code == 201

    reviews_response = await client.get(
        f"/spot/{test_spots[0].id}/reviews",
        headers={"Authorization": f"Bearer {user_1_token}"},
    )
    assert reviews_response.status_code == 200
    reviews_data = reviews_response.json()
    review_qualities = {item["quality"] for item in reviews_data}
    assert 8 in review_qualities
    assert 5 in review_qualities
    assert all("user_id" not in item for item in reviews_data)

    spot_response = await client.get(
        f"/spot/{test_spots[0].id}",
        headers={"Authorization": f"Bearer {user_1_token}"},
    )
    assert spot_response.status_code == 200
    spot_data = spot_response.json()
    assert "review_summary" in spot_data
    assert spot_data["review_summary"]["review_count"] == 2
    assert "recent_reviews" in spot_data
    assert len(spot_data["recent_reviews"]) >= 2
    assert all("user_id" not in item for item in spot_data["recent_reviews"])
