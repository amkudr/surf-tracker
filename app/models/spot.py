from __future__ import annotations

from enum import IntEnum

from sqlalchemy import Column, Float, Integer, JSON, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from .base import Base


class SpotDifficulty(IntEnum):

    beginner = 0
    intermediate = 1
    advanced = 2
    expert = 3


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    difficulty = Column(ARRAY(Integer).with_variant(JSON, "sqlite"), nullable=True)

    surf_forecast_name = Column(String, nullable=True)

    # Relationships
    surf_sessions = relationship(
        "SurfSession",
        back_populates="spot",
        cascade="all, delete",
        passive_deletes=True,
    )
    forecasts = relationship(
        "Forecast",
        back_populates="spot",
        cascade="all, delete",
        passive_deletes=True,
    )
    surf_forecasts = relationship(
        "SurfForecast",
        back_populates="spot",
        cascade="all, delete",
        passive_deletes=True,
    )
    tides = relationship(
        "Tide",
        back_populates="spot",
        cascade="all, delete",
        passive_deletes=True,
    )
