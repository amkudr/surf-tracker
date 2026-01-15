from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Path
from app.database import AsyncSession, db_dependency
from app.schemas.surf_session import SurfSessionCreate, SurfSessionResponse
from app.services.surf_session_service import (
    create_surf_session,
    list_surf_sessions,
    get_surf_session,
    update_surf_session,
    delete_surf_session,
)

router = APIRouter(prefix="/surf_session", tags=["surf_session"])


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=SurfSessionResponse
)
async def create_surf_session_endpoint(
    user_id: int, db: db_dependency, surf_session_create: SurfSessionCreate
) -> SurfSessionResponse:
    created = await create_surf_session(db, surf_session_create.model_dump(), user_id)
    if created is None:
        raise HTTPException(status_code=500, detail="Error creating session")
    return created


@router.get(
    "/", status_code=status.HTTP_200_OK, response_model=list[SurfSessionResponse]
)
async def list_surf_sessions_endpoint(user_id: int, db: db_dependency):
    sessions = await list_surf_sessions(db, user_id)

    if len(sessions) == 0:
        raise HTTPException(status_code=404, detail="No surf sessions found")
    return sessions


@router.get(
    "/{surf_session_id}",
    status_code=status.HTTP_200_OK,
    response_model=SurfSessionResponse,
)
async def get_surf_session_endpoint(
    surf_session_id: int, db: db_dependency, user_id: int
):
    session = await get_surf_session(db, surf_session_id, user_id)
    if session is None:
        raise HTTPException(status_code=404, detail="No surf sessions found")
    return session


@router.put(
    "/{surf_session_id}",
    status_code=status.HTTP_200_OK,
    response_model=SurfSessionResponse,
)
async def update_surf_session_endpoint(
    surf_session_id: int,
    user_id: int,
    db: db_dependency,
    update_data: SurfSessionCreate,
):
    session = await update_surf_session(db, surf_session_id, user_id, update_data)
    if session is None:
        raise HTTPException(status_code=404, detail="No surf sessions found")
    return session


@router.delete("/{surf_session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_surf_session_endpoint(
    surf_session_id: int, db: db_dependency, user_id: int
):
    result = await delete_surf_session(db, surf_session_id, user_id)
    if result is False:
        raise HTTPException(status_code=500, detail="Error creating session")
