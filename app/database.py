from collections.abc import AsyncGenerator
from typing import Annotated
from fastapi import Depends

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import settings

url = make_url(settings.database_url)

# Only pass pooling parameters for non-SQLite backends; SQLite's StaticPool/aiosqlite rejects them.
engine_kwargs = {
    "echo": settings.echo_sql,
}
if not url.drivername.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": settings.pool_size,
        "max_overflow": settings.max_overflow,
    })
async_engine = create_async_engine(settings.database_url, **engine_kwargs)
async_session = async_sessionmaker(bind=async_engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


db_dependency = Annotated[AsyncSession, Depends(get_db)]
