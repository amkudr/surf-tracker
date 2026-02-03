from fastapi import APIRouter, HTTPException, status
from app.database import db_dependency
from app.schemas.spot import SpotCreate, SpotResponse
from app.services.spot_service import create_spot, get_spot_by_id, list_spots

router = APIRouter(prefix="/spot", tags=["spot"])


@router.get(
    "/", status_code=status.HTTP_200_OK, response_model=list[SpotResponse]
)
async def list_spots_endpoint(db: db_dependency):
    spots = await list_spots(db)
    return spots


@router.get(
    "/{spot_id}",
    status_code=status.HTTP_200_OK,
    response_model=SpotResponse,
)
async def get_spot_endpoint(spot_id: int, db: db_dependency):
    spot = await get_spot_by_id(db, spot_id)
    if spot is None:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=SpotResponse
)
async def create_spot_endpoint(
    db: db_dependency, spot_create: SpotCreate
) -> SpotResponse:
    created = await create_spot(
        db,
        name=spot_create.name,
        lat=spot_create.latitude,
        lon=spot_create.longitude,
        difficulty=spot_create.difficulty,
        surf_forecast_name=spot_create.surf_forecast_name,
    )
    return created
