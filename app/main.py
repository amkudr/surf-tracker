import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.admin import init_admin
from app.api.v1 import auth, spots, surf_sessions, surfboards
from app.core.config import settings
from app.core.exceptions import BusinessLogicError, ExternalAPIError, ValidationError
from app.database import async_engine
from app.logging import configure_logging, request_id_var
from app.routers import weather
from app.schemas.error import ErrorResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    yield


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_var.set(req_id)
        start = time.monotonic()
        try:
            response = await call_next(request)
            duration_ms = round((time.monotonic() - start) * 1000, 3)
            response.headers["X-Request-ID"] = req_id
            logger.info(
                "http_request",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "client": request.client.host if request.client else None,
                },
            )
            return response
        finally:
            request_id_var.reset(token)


app = FastAPI(lifespan=lifespan)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
admin = init_admin(app)


@app.get("/health", tags=["health"])
async def healthcheck():
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "up"}
    except Exception:
        logger.exception(
            "healthcheck_failed",
            extra={"path": "/health"},
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "db": "down"},
        )

@app.exception_handler(BusinessLogicError)
async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
    logger.warning(
        "business_logic_error",
        extra={
            "path": request.url.path,
            "code": exc.code,
            "detail": exc.message,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(detail=exc.message, code=exc.code).model_dump()
    )

@app.exception_handler(ExternalAPIError)
async def external_api_error_handler(request: Request, exc: ExternalAPIError):
    logger.error(
        "external_api_error",
        exc_info=exc.original_error or exc,
        extra={"path": request.url.path},
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=ErrorResponse(detail=exc.message, code="EXTERNAL_API_ERROR").model_dump()
    )

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    logger.warning(
        "validation_error",
        extra={"path": request.url.path, "detail": exc.message},
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(detail=exc.message, code="VALIDATION_ERROR").model_dump()
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_exception", extra={"path": request.url.path})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(detail="Internal server error", code="INTERNAL_ERROR").model_dump(),
    )

app.include_router(auth.router)
app.include_router(surf_sessions.router)
app.include_router(spots.router)
app.include_router(surfboards.router)
app.include_router(weather.router)
