from .base import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Date, func


class SurfSession(Base):
    __tablename__ = "surf_sessions"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    spot = Column(String)
    date = Column(Date)
    duration_minutes = Column(Integer)
    wave_quality = Column(Integer)
    # user_id = Column(Integer, ForeignKey("users.id"))
    user_id = Column(Integer)
    notes = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
