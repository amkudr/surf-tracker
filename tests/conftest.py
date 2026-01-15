from datetime import date
from typing import AsyncGenerator
from collections.abc import Generator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db
from app.models import Base
from app.models.surf_session import SurfSession


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


@pytest.fixture
def client(test_db: AsyncSession) -> Generator[TestClient, None, None]:  # Типизация
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_surf_sessions(test_db: AsyncSession):

    surf_sessions = [
        SurfSession(
            spot="Fisherman",
            date=date(2026, 1, 13),
            duration_minutes=120,
            wave_quality=8,
            notes="It was really very good good",
            user_id=1,
        ),
        SurfSession(
            spot="Main Point",
            date=date(2026, 1, 5),
            duration_minutes=40,
            wave_quality=3,
            notes="It was really not very good good",
            user_id=1,
        ),
    ]

    for surf_session in surf_sessions:
        test_db.add(surf_session)
    await test_db.commit()
