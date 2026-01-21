from typing import Optional
from pydantic import BaseModel, ConfigDict


class SpotCreate(BaseModel):
    """Schema for creating a new surf spot."""
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    difficulty: Optional[list[int]] = None


class SpotResponse(BaseModel):
    """Schema for spot API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    difficulty: Optional[list[int]] = None
