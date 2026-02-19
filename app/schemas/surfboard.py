from pydantic import BaseModel
from pydantic.config import ConfigDict


class SurfboardCreate(BaseModel):
    name: str | None = None
    brand: str | None = None
    model: str | None = None
    length_ft: float
    width_in: float | None = None
    thickness_in: float | None = None
    volume_liters: float | None = None


class SurfboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str | None = None
    brand: str | None = None
    model: str | None = None
    length_ft: float
    width_in: float | None = None
    thickness_in: float | None = None
    volume_liters: float | None = None
    owner_id: int


class SurfboardUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    model: str | None = None
    length_ft: float | None = None
    width_in: float | None = None
    thickness_in: float | None = None
    volume_liters: float | None = None
