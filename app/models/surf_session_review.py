from sqlalchemy import Column, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from .base import Base


class SurfSessionReview(Base):
    __tablename__ = "surf_session_reviews"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    surf_session_id = Column(
        Integer,
        ForeignKey("surf_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    spot_id = Column(
        Integer,
        ForeignKey("spots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    observed_at = Column(DateTime, nullable=False, index=True)
    quality = Column(Integer, nullable=False)
    crowded_level = Column(Integer, nullable=True)
    wave_height_index = Column(Integer, nullable=True)
    short_long_index = Column(Integer, nullable=True)
    wind_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    surf_session = relationship("SurfSession", back_populates="review")
    spot = relationship("Spot", back_populates="surf_session_reviews")
    user = relationship("User", back_populates="surf_session_reviews")
