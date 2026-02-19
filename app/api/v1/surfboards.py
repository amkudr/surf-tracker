from fastapi import APIRouter, HTTPException, status

from app.api.v1.auth import CurrentUser
from app.database import db_dependency
from app.schemas.surfboard import SurfboardCreate, SurfboardResponse, SurfboardUpdate
from app.services.surfboard_service import (
    create_surfboard,
    delete_surfboard,
    get_surfboard_by_id,
    get_surfboards_by_owner_id,
    update_surfboard,
)

router = APIRouter(prefix="/surfboard", tags=["surfboard"])

@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=SurfboardResponse
)
async def create_surfboard_endpoint(
    current_user: CurrentUser,
    db: db_dependency,
    surfboard_create: SurfboardCreate,
) -> SurfboardResponse:
    created = await create_surfboard(db, surfboard_create, current_user.id)
    return created

@router.get(
    "/", status_code=status.HTTP_200_OK, response_model=list[SurfboardResponse]
)
async def list_surfboards_endpoint(
    current_user: CurrentUser,
    db: db_dependency,
):
    surfboards = await get_surfboards_by_owner_id(db, current_user.id)
    return surfboards

@router.get(
    "/{surfboard_id}",
    status_code=status.HTTP_200_OK,
    response_model=SurfboardResponse,
)
async def get_surfboard_endpoint(
    surfboard_id: int,
    db: db_dependency,
    current_user: CurrentUser,
):
    surfboard = await get_surfboard_by_id(db, surfboard_id)
    if surfboard is None or surfboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Surfboard not found",
        )
    return surfboard

@router.put(
    "/{surfboard_id}",
    status_code=status.HTTP_200_OK,
    response_model=SurfboardResponse,
)
async def update_surfboard_endpoint(
    surfboard_id: int,
    db: db_dependency,
    current_user: CurrentUser,
    surfboard_update: SurfboardUpdate,
) -> SurfboardResponse:
    # Ensure the surfboard exists and belongs to the current user
    surfboard = await get_surfboard_by_id(db, surfboard_id)
    if surfboard is None or surfboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Surfboard not found",
        )

    updated = await update_surfboard(db, surfboard_id, surfboard_update)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Surfboard not found",
        )
    return updated

@router.delete(
    "/{surfboard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_surfboard_endpoint(surfboard_id: int, db: db_dependency, current_user: CurrentUser):
    result = await delete_surfboard(db, surfboard_id, current_user.id)
    if result is False:
        raise HTTPException(status_code=404, detail="Surfboard not found")
