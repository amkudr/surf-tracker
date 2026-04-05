import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.users import User


@pytest_asyncio.fixture
async def admin_user(test_db: AsyncSession):
    user = User(
        email="admin@example.com",
        hashed_password=hash_password("adminpassword123"),
        is_admin=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def authenticated_admin_client(client: AsyncClient, admin_user):
    login_data = {
        "username": "admin@example.com",
        "password": "adminpassword123",
    }
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    client.headers.update({"Authorization": f"Bearer {token_data['access_token']}"})
    return client


@pytest.mark.asyncio
async def test_create_spot_standard_user_forbidden(authenticated_client: AsyncClient):
    payload = {"name": "Forbidden Spot"}
    response = await authenticated_client.post("/spot/", json=payload)
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin privileges required"}


@pytest.mark.asyncio
async def test_create_spot_admin_success(authenticated_admin_client: AsyncClient):
    payload = {"name": "Admin Spot", "latitude": 10.0, "longitude": 10.0}
    response = await authenticated_admin_client.post("/spot/", json=payload)
    assert response.status_code == 201
    assert response.json()["name"] == "Admin Spot"


@pytest.mark.asyncio
async def test_update_spot_standard_user_forbidden(authenticated_client: AsyncClient, test_spots):
    spot_id = test_spots[0].id
    response = await authenticated_client.put(f"/spot/{spot_id}", json={"name": "New Name"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_spot_admin_success(authenticated_admin_client: AsyncClient, test_spots):
    spot_id = test_spots[0].id
    payload = {"name": "Admin Edited Spot"}
    response = await authenticated_admin_client.put(f"/spot/{spot_id}", json=payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Edited Spot"


@pytest.mark.asyncio
async def test_delete_spot_standard_user_forbidden(authenticated_client: AsyncClient, test_spots):
    spot_id = test_spots[0].id
    response = await authenticated_client.delete(f"/spot/{spot_id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_spot_admin_success(authenticated_admin_client: AsyncClient, test_spots):
    spot_id = test_spots[0].id
    response = await authenticated_admin_client.delete(f"/spot/{spot_id}")
    assert response.status_code == 204

    # Ensure the spot is actually deleted
    get_response = await authenticated_admin_client.get(f"/spot/{spot_id}")
    assert get_response.status_code == 404
