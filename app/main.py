from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app import models
from app.admin import init_admin
from app.api.v1 import auth, spots, surf_sessions, surfboards
from app.core.config import settings
from app.core.exceptions import BusinessLogicError, ExternalAPIError, ValidationError
from app.database import async_engine
from app.routers import weather
from app.schemas.error import ErrorResponse


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
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
admin = init_admin(app)

@app.exception_handler(BusinessLogicError)
async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(detail=exc.message, code=exc.code).model_dump()
    )

@app.exception_handler(ExternalAPIError)
async def external_api_error_handler(request: Request, exc: ExternalAPIError):
    # Log original error here if needed
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=ErrorResponse(detail=exc.message, code="EXTERNAL_API_ERROR").model_dump()
    )

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(detail=exc.message, code="VALIDATION_ERROR").model_dump()
    )

app.include_router(auth.router)
app.include_router(surf_sessions.router)
app.include_router(spots.router)
app.include_router(surfboards.router)
app.include_router(weather.router)
