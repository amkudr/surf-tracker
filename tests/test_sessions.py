from unittest.mock import ANY


def test_create_session(client):
    surf_session = {
        "spot": "Plantations",
        "date": "2026-01-13",
        "duration_minutes": 120,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = client.post("/surf_session/", params={"user_id": 1}, json=surf_session)
    assert response.status_code == 201


def test_get_session(client, test_surf_sessions):
    response = client.get(f"/surf_session/{1}", params={"user_id": 1})

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


def test_list_surf_session(client, test_surf_sessions):
    response = client.get(f"/surf_session/", params={"user_id": 1})
    data = response.json()
    assert len(data) == 2
    assert data[0]["spot"] == "Fisherman"
    assert data[1]["spot"] == "Main Point"


def test_update_session(client, test_surf_sessions):
    update_data = {
        "spot": "Fisherman",
        "date": "2026-01-13",
        "duration_minutes": 70,
        "wave_quality": 8,
        "notes": "It was really very good good",
    }
    response = client.put(f"/surf_session/{1}", params={"user_id": 1}, json=update_data)
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


def test_delete_session(client, test_surf_sessions):
    response = client.delete(f"/surf_session/{1}", params={"user_id": 1})
    assert response.status_code == 204
    response = client.get(f"/surf_session/{1}", params={"user_id": 1})
    assert response.status_code == 404


def test_error_404(client):
    response = client.get(f"/surf_session/", params={"user_id": 1})
    response = client.get("/surf_session/999", params={"user_id": 1})
    assert response.status_code == 404
