"""add fiels surf_forecast_name to Spot and created new SurfForecast table

Revision ID: 85cd77af170c
Revises: bda0c001287d
Create Date: 2026-01-31 19:01:37.156882

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '85cd77af170c'
down_revision: Union[str, Sequence[str], None] = 'bda0c001287d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    spot_columns = {column["name"] for column in inspector.get_columns("spots")}
    if "surf_forecast_name" not in spot_columns:
        op.add_column("spots", sa.Column("surf_forecast_name", sa.String(), nullable=True))

    if not inspector.has_table("surf_forecasts"):
        op.create_table(
            "surf_forecasts",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("spot_id", sa.Integer(), nullable=False),
            sa.Column("timestamp", sa.DateTime(), nullable=False),
            sa.Column("wave_height", sa.Float(), nullable=True),
            sa.Column("period", sa.Float(), nullable=True),
            sa.Column("wind_speed", sa.Float(), nullable=True),
            sa.Column("rating", sa.Integer(), nullable=True),
            sa.Column("is_partial", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.ForeignKeyConstraint(["spot_id"], ["spots.id"]),
            sa.UniqueConstraint("spot_id", "timestamp", name="uq_surf_forecast_spot_timestamp"),
        )
        op.create_index("ix_surf_forecasts_spot_id", "surf_forecasts", ["spot_id"], unique=False)
        op.create_index("ix_surf_forecasts_timestamp", "surf_forecasts", ["timestamp"], unique=False)

    if not inspector.has_table("forecasts"):
        op.create_table(
            "forecasts",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("spot_id", sa.Integer(), nullable=False),
            sa.Column("timestamp", sa.DateTime(), nullable=False),
            sa.Column("wave_height_min", sa.Float(), nullable=True),
            sa.Column("wave_height_max", sa.Float(), nullable=True),
            sa.Column("period", sa.Float(), nullable=True),
            sa.Column("energy", sa.Float(), nullable=True),
            sa.Column("wind_speed", sa.Float(), nullable=True),
            sa.Column("wind_direction", sa.String(), nullable=True),
            sa.Column("rating", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["spot_id"], ["spots.id"]),
        )
        op.create_index("ix_forecasts_spot_id", "forecasts", ["spot_id"], unique=False)
        op.create_index("ix_forecasts_timestamp", "forecasts", ["timestamp"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("surf_forecasts"):
        existing_indexes = {index["name"] for index in inspector.get_indexes("surf_forecasts")}
        if "ix_surf_forecasts_timestamp" in existing_indexes:
            op.drop_index("ix_surf_forecasts_timestamp", table_name="surf_forecasts")
        if "ix_surf_forecasts_spot_id" in existing_indexes:
            op.drop_index("ix_surf_forecasts_spot_id", table_name="surf_forecasts")
        op.drop_table("surf_forecasts")

    if inspector.has_table("forecasts"):
        existing_indexes = {index["name"] for index in inspector.get_indexes("forecasts")}
        if "ix_forecasts_timestamp" in existing_indexes:
            op.drop_index("ix_forecasts_timestamp", table_name="forecasts")
        if "ix_forecasts_spot_id" in existing_indexes:
            op.drop_index("ix_forecasts_spot_id", table_name="forecasts")
        op.drop_table("forecasts")

    spot_columns = {column["name"] for column in inspector.get_columns("spots")}
    if "surf_forecast_name" in spot_columns:
        op.drop_column("spots", "surf_forecast_name")
