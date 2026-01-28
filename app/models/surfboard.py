from sqlalchemy import ForeignKey, Integer, String, Column
from .base import Base
from sqlalchemy.orm import relationship


class Surfboard(Base):
    __tablename__ = "surfboards"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    length_ft = Column(Integer, nullable=False)
    volume_liters = Column(Integer, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="surfboards")
    surf_sessions = relationship("SurfSession", back_populates="surfboard")