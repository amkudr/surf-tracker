from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SurfSessionReviewCreate(BaseModel):
    observed_at: datetime | None = None
    quality: int = Field(ge=0, le=10)
    crowded_level: int = Field(ge=0, le=10)
    wave_height_index: int = Field(ge=0, le=10)
    short_long_index: int = Field(ge=0, le=10)
    wind_index: int = Field(ge=0, le=10)


class SurfSessionReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    surf_session_id: int
    spot_id: int
    observed_at: datetime
    quality: int
    crowded_level: int | None = None
    wave_height_index: int | None = None
    short_long_index: int | None = None
    wind_index: int | None = None
    created_at: datetime


class SpotReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    surf_session_id: int
    observed_at: datetime
    quality: int
    crowded_level: int | None = None
    wave_height_index: int | None = None
    short_long_index: int | None = None
    wind_index: int | None = None


class SpotReviewSummaryResponse(BaseModel):
    weighted_quality: float | None = None
    avg_crowded_level: float | None = None
    avg_wave_height_index: float | None = None
    avg_short_long_index: float | None = None
    avg_wind_index: float | None = None
    review_count: int = 0
    latest_observed_at: datetime | None = None
