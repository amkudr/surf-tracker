from .base import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship


class SurfSession(Base):
    __tablename__ = "surf_sessions"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=True)
    surfboard_id = Column(Integer, ForeignKey("surfboards.id"), nullable=True)
    surfboard_name = Column(String, nullable=True)
    surfboard_brand = Column(String, nullable=True)
    surfboard_model = Column(String, nullable=True)
    surfboard_length_ft = Column(Float, nullable=True)
    surfboard_width_in = Column(Float, nullable=True)
    surfboard_thickness_in = Column(Float, nullable=True)
    surfboard_volume_liters = Column(Float, nullable=True)
    datetime = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer)
    wave_quality = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Weather from SurfForecast (averaged over session window)
    wave_height_m = Column(Float, nullable=True)
    wave_period = Column(Float, nullable=True)
    wave_dir = Column(String, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    wind_dir = Column(String, nullable=True)
    energy = Column(Float, nullable=True)
    rating = Column(Integer, nullable=True)
    
    # Tide data
    tide_height_m = Column(Float, nullable=True)
    tide_low_m = Column(Float, nullable=True)
    tide_high_m = Column(Float, nullable=True)

    # Relationships
    spot = relationship("Spot")
    surfboard = relationship("Surfboard", back_populates="surf_sessions")
    user = relationship("User", back_populates="surf_sessions")
