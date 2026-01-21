from typing import Optional
from pydantic import BaseModel, Field
from datetime import date, datetime


class SurfSessionBase(BaseModel):
    spot_id: int = Field(gt=0)
    date: date
    duration_minutes: int = Field(gt=0, lt=1000)
    wave_quality: int = Field(gt=0, lt=11)
    notes: str | None = Field(default=None, max_length=500)


class SurfSessionCreate(SurfSessionBase):
    pass


class SurfSessionResponse(SurfSessionBase):
    id: int
    user_id: int
    created_at: datetime
