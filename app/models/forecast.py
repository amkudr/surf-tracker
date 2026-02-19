from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    wave_height_min = Column(Float, nullable=True)
    wave_height_max = Column(Float, nullable=True)
    period = Column(Float, nullable=True)
    energy = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)

    spot = relationship("Spot", back_populates="forecasts", passive_deletes=True)
