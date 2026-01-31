from __future__ import annotations

import enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class TideType(str, enum.Enum):
    HIGH = "HIGH"
    LOW = "LOW"


class Tide(Base):
    __tablename__ = "tides"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    height = Column(Float, nullable=False)
    tide_type = Column(String, nullable=False)  # HIGH or LOW

    spot = relationship("Spot")

    __table_args__ = (
        UniqueConstraint('spot_id', 'timestamp', 'tide_type', name='uq_tide_spot_timestamp_type'),
    )
