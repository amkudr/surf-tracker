from pydantic import BaseModel
from pydantic.config import ConfigDict


class SurfboardCreate(BaseModel):
    name: str
    brand: str | None = None
    model: str | None = None
    length_ft: float
    volume_liters: float

class SurfboardResponse(BaseModel): 
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    brand: str | None = None
    model: str | None = None
    length_ft: float
    volume_liters: float

class SurfboardUpdate(BaseModel):
    name: str | None = None
    brand: str | None = None
    model: str | None = None
    length_ft: float | None = None
    volume_liters: float | None = None