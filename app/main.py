from fastapi import FastAPI
from app import models
from app.database import async_engine
from app.api.v1 import surf_sessions

app = FastAPI()

async def init_models():
    async with async_engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

app.include_router(surf_sessions.router)
