from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class SurfForecast(Base):
    __tablename__ = "surf_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    wave_height = Column(Float, nullable=True)
    period = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    rating = Column(Integer, nullable=True)

    spot = relationship("Spot")

    __table_args__ = (
        UniqueConstraint('spot_id', 'timestamp', name='uq_surf_forecast_spot_timestamp'),
    )
