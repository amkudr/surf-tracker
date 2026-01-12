from .base import Base
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date


class SurfSession(Base):
    __tablename__ = "surf_sessions"

    id = Column(Integer, primary_key=True, index=True)
    spot = Column(String)
    date = Column(Date)
    duration_minutes = Column(Integer)
    wave_quality = Column(Integer)
    # user_id = Column(Integer, ForeignKey("users.id"))
    user_id = Column(Integer)
    notes = Column(String)
    created_at = Column(Date)
