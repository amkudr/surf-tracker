from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Surfboard(Base):
    __tablename__ = "surfboards"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    length_ft = Column(Float, nullable=False)
    width_in = Column(Float, nullable=True)
    thickness_in = Column(Float, nullable=True)
    volume_liters = Column(Float, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="surfboards")
    surf_sessions = relationship("SurfSession", back_populates="surfboard")
