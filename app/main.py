from contextlib import asynccontextmanager
from fastapi import FastAPI
from app import models
from app.database import async_engine
from app.api.v1 import auth, surf_sessions, spots


async def init_models():
    async with async_engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_models()
    yield
    # Shutdown 


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(surf_sessions.router)
app.include_router(spots.router)
