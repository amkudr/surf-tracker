from sqlalchemy import Boolean, Column, DateTime, Integer, String, false, func
from sqlalchemy.orm import relationship

from .base import Base


class User(Base):
    __tablename__ = "users"
    __mapper_args__ = {"eager_defaults": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    is_admin = Column(Boolean, server_default=false(), nullable=False)

    surf_sessions = relationship("SurfSession", back_populates="user")
    surfboards = relationship("Surfboard", back_populates="owner")
    surf_session_reviews = relationship("SurfSessionReview", back_populates="user")
