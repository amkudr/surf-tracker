from pydantic import BaseModel
from pydantic.config import ConfigDict


class SurfboardCreate(BaseModel):
    name: str
    brand: str | None = None
    model: str | None = None
    length_ft: int
    volume_liters: int
    owner_id: int

class SurfboardResponse(BaseModel): 
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    brand: str | None = None
    model: str | None = None
    length_ft: int
    volume_liters: int
    owner_id: int

class SurfboardUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    model: str | None = None
    length_ft: int | None = None
    volume_liters: int | None = None