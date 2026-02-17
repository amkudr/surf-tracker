from pydantic import BaseModel, Field, model_validator, field_validator, ConfigDict
from datetime import datetime

from app.schemas.spot import SpotResponse
from app.schemas.surfboard import SurfboardResponse
from app.schemas.surf_session_review import (
    SurfSessionReviewCreate,
    SurfSessionReviewResponse,
)


class SurfSessionBase(BaseModel):
    datetime: datetime
    duration_minutes: int = Field(gt=0, lt=1000)
    notes: str | None = Field(default=None, max_length=500)
    surfboard_name: str | None = None
    surfboard_brand: str | None = None
    surfboard_model: str | None = None
    surfboard_length_ft: float | None = Field(default=None, gt=0)
    surfboard_width_in: float | None = Field(default=None, gt=0)
    surfboard_thickness_in: float | None = Field(default=None, gt=0)
    surfboard_volume_liters: float | None = Field(default=None, gt=0)


class SurfSessionCreate(SurfSessionBase):
    spot_id: int | None = Field(None, gt=0)
    spot_name: str | None = Field(None)
    review: SurfSessionReviewCreate | None = None
    surfboard_id: int | None = Field(None, gt=0)
    save_surfboard_to_quiver: bool = False

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
    surfboard: SurfboardResponse | None = None
    review: SurfSessionReviewResponse | None = None
    wave_height_m: float | None = None
    wave_period: float | None = None
    wave_dir: str | None = None
    wind_speed_kmh: float | None = None
    wind_dir: str | None = None
    energy: float | None = None
    rating: int | None = None
    
    # Tide data
    tide_height_m: float | None = None
    tide_low_m: float | None = None
    tide_high_m: float | None = None

    @field_validator("wave_dir", "wind_dir", mode="before")
    @classmethod
    def coerce_dir_to_str(cls, v: int | str | None) -> str | None:
        if v is None:
            return None
        return str(v).strip() or None
