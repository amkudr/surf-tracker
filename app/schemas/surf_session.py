from typing import Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict
from datetime import datetime

from app.schemas.spot import SpotResponse


class SurfSessionBase(BaseModel):
    datetime: datetime
    duration_minutes: int = Field(gt=0, lt=1000)
    wave_quality: int = Field(gt=0, lt=11)
    notes: str | None = Field(default=None, max_length=500)


class SurfSessionCreate(SurfSessionBase):
    spot_id: int | None = Field(None, gt=0)
    spot_name: str | None = Field(None)
    surfboard_id: int | None = Field(None, gt=0)

    @model_validator(mode='after')
    def validate_spot_reference(self):
        if self.spot_id is None and self.spot_name is None:
            raise ValueError("Either spot_id or spot_name must be provided")
        if self.spot_id is not None and self.spot_name is not None:
            raise ValueError("Cannot provide both spot_id and spot_name")
        return self


class SurfSessionResponse(SurfSessionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    spot_id: int
    surfboard_id: int | None = None
    user_id: int
    created_at: datetime
    spot: SpotResponse
    wave_height_m: float | None = None
    wave_period: float | None = None
    wave_dir: int | None = None
    wind_speed_kmh: float | None = None
    wind_dir: int | None = None
