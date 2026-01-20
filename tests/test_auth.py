import pytest


@pytest.mark.asyncio
async def test_register(client):
    user = {
        "email": "newuser@example.com",
        "password": "securepassword123"
    }
    response = await client.post("/auth/register", json=user)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "created_at" in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_duplicate_email(client, test_user):
    user = {
        "email": test_user.email,
        "password": "somepassword123"
    }
    response = await client.post("/auth/register", json=user)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login(client, test_user):
    """Test successful login"""
    login_data = {
        "username": test_user.email,
        "password": "testpassword123"
    }
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert len(data["access_token"]) > 0


@pytest.mark.asyncio
async def test_invalid_password(client, test_user):
    login_data = {
        "username": test_user.email,
        "password": "wrongpassword"
    }
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user(authenticated_client, test_user):
    response = await authenticated_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert "created_at" in data
    assert "password" not in data
