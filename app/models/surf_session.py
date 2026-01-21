from .base import Base
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
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

    # Relationships
    spot = relationship("Spot")
    user = relationship("User", back_populates="surf_sessions")
