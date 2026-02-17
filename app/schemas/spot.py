from pydantic import BaseModel, ConfigDict, Field

from app.schemas.surf_session_review import SpotReviewResponse, SpotReviewSummaryResponse

class SpotCreate(BaseModel):
    """Schema for creating a new surf spot."""
    name: str
    latitude: float | None = None
    longitude: float | None = None
    difficulty: list[int] | None = None
    surf_forecast_name: str | None = None


class SpotResponse(BaseModel):
    """Schema for spot API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    latitude: float | None = None
    longitude: float | None = None
    difficulty: list[int] | None = None
    surf_forecast_name: str | None = None
    review_summary: SpotReviewSummaryResponse | None = None
    recent_reviews: list[SpotReviewResponse] = Field(default_factory=list)
