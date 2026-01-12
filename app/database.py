from collections.abc import AsyncGenerator
from typing import Annotated
from fastapi import Depends

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

SQLALCHEMY_DATABASE_URL = (
    "postgresql+asyncpg://postgres:postgres@localhost:5432/surf_tracker"
)

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,  
    pool_size=10,
    max_overflow=20
)
async_session = async_sessionmaker(bind=async_engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


db_dependency = Annotated[AsyncSession, Depends(get_db)]
