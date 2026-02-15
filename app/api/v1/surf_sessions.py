from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import AsyncSession, db_dependency
from app.schemas.surf_session import SurfSessionCreate, SurfSessionResponse
from app.services.surf_session_service import (
    create_surf_session,
    list_surf_sessions,
    get_surf_session,
    update_surf_session,
    delete_surf_session,
)
from app.api.v1.auth import CurrentUser

router = APIRouter(prefix="/surf_session", tags=["surf_session"])


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=SurfSessionResponse
)
async def create_surf_session_endpoint(
    current_user: CurrentUser, db: db_dependency,  surf_session_create: SurfSessionCreate
) -> SurfSessionResponse:
    session_data = surf_session_create.model_dump()
    review_data = session_data.pop("review", None)
    created = await create_surf_session(db, session_data, current_user.id, review_data)
    if created is None:
        raise HTTPException(status_code=500, detail="Error creating session")
    return created


@router.get(
    "/", status_code=status.HTTP_200_OK, response_model=list[SurfSessionResponse]
)
async def list_surf_sessions_endpoint(current_user: CurrentUser, db: db_dependency):
    sessions = await list_surf_sessions(db, current_user.id)
    return sessions


@router.get(
    "/{surf_session_id}",
    status_code=status.HTTP_200_OK,
    response_model=SurfSessionResponse,
)
async def get_surf_session_endpoint(
    surf_session_id: int, db: db_dependency, current_user: CurrentUser
):
    session = await get_surf_session(db, surf_session_id, current_user.id)
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
    current_user: CurrentUser,
    db: db_dependency,
    update_data: SurfSessionCreate,
):
    session = await update_surf_session(db, surf_session_id, current_user.id, update_data)
    if session is None:
        raise HTTPException(status_code=404, detail="No surf sessions found")
    return session


@router.delete("/{surf_session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_surf_session_endpoint(
    surf_session_id: int, db: db_dependency, current_user: CurrentUser
):
    result = await delete_surf_session(db, surf_session_id, current_user.id)
    if result is False:
        raise HTTPException(status_code=404, detail="Surf session not found")
