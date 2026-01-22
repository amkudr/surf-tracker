from .base import Base
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship


class SurfSession(Base):
    __tablename__ = "surf_sessions"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=True)
    date = Column(Date)
    duration_minutes = Column(Integer)
    wave_quality = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Weather data from OpenMeteo API
    wave_height_m = Column(Float, nullable=True)
    wave_period = Column(Float, nullable=True)
    wave_dir = Column(Integer, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    wind_dir = Column(Integer, nullable=True)

    # Relationships
    spot = relationship("Spot")
    user = relationship("User", back_populates="surf_sessions")
