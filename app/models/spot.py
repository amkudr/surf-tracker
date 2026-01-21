from __future__ import annotations

from enum import IntEnum

from sqlalchemy import Column, Float, Integer, JSON, String
from sqlalchemy.dialects.postgresql import ARRAY

from .base import Base


class SpotDifficulty(IntEnum):
    """Difficulty levels for a surf spot (0=beginner, 3=expert)."""

    beginner = 0
    intermediate = 1
    advanced = 2
    expert = 3


class Spot(Base):
    """
    Surf spot reference data.

    Fields:
    - name: unique spot name (e.g., "Tangalle")
    - latitude/longitude: coordinates in degrees (nullable to support backfill from existing session strings)
    - difficulty: optional array of adjacent difficulty integers (0=beginner, 1=intermediate, 2=advanced, 3=expert)
                 validated at DB level via CHECK constraint to ensure 1-3 adjacent values
    """

    __tablename__ = "spots"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Array of integers: 0=beginner, 1=intermediate, 2=advanced, 3=expert
    # Postgres: INTEGER[] array
    # SQLite (tests): fallback to JSON array of integers
    difficulty = Column(ARRAY(Integer).with_variant(JSON, "sqlite"), nullable=True)
