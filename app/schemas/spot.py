from typing import Optional
from pydantic import BaseModel


class SpotCreate(BaseModel):
    """Schema for creating a new surf spot."""
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    difficulty: Optional[list[int]] = None


class SpotResponse(BaseModel):
    """Schema for spot API responses."""
    id: int
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    difficulty: Optional[list[int]] = None
