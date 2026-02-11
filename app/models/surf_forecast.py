from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class SurfForecast(Base):
    __tablename__ = "surf_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    wave_height = Column(Float, nullable=True)
    wave_direction = Column(String, nullable=True)
    period = Column(Float, nullable=True)
    energy = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)
    updated_at = Column(DateTime, nullable=True, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    spot = relationship("Spot", back_populates="surf_forecasts", passive_deletes=True)

    __table_args__ = (
        UniqueConstraint('spot_id', 'timestamp', name='uq_surf_forecast_spot_timestamp'),
    )
