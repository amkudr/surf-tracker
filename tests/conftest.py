from datetime import date
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import get_db
from app.models import Base
from app.models.spot import Spot
from app.models.surf_session import SurfSession
from app.models.users import User


SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

async_session = async_sessionmaker(bind=async_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    # Create tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_engine.connect() as connection:
        trans = await connection.begin()  # external transaction
        session = async_session(bind=connection)  # session above external transaction

        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()


@pytest_asyncio.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_spots(test_db: AsyncSession):
    spots = [
        Spot(name="Fisherman", latitude=None, longitude=None, difficulty=None),
        Spot(name="Main Point", latitude=None, longitude=None, difficulty=None),
    ]
    for spot in spots:
        test_db.add(spot)
    await test_db.commit()
    for spot in spots:
        await test_db.refresh(spot)
    return spots


@pytest_asyncio.fixture
async def test_surf_sessions(test_db: AsyncSession, test_user: User, test_spots):
    surf_sessions = [
        SurfSession(
            spot_id=test_spots[0].id,
            date=date(2026, 1, 13),
            duration_minutes=120,
            wave_quality=8,
            notes="It was really very good good",
            user_id=test_user.id,
        ),
        SurfSession(
            spot_id=test_spots[1].id,
            date=date(2026, 1, 5),
            duration_minutes=40,
            wave_quality=3,
            notes="It was really not very good good",
            user_id=test_user.id,
        ),
    ]

    for surf_session in surf_sessions:
        test_db.add(surf_session)
    await test_db.commit()


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession):
    from app.core.security import hash_password
    
    user = User(
        email="test@example.com",
        hashed_password=hash_password("testpassword123")
    )
    
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, test_user):
    """Fixture that performs login and returns access token"""
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    return token_data["access_token"]


@pytest_asyncio.fixture
async def authenticated_client(client: AsyncClient, auth_token):
    """Fixture that returns a client with authentication headers set"""
    client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return client