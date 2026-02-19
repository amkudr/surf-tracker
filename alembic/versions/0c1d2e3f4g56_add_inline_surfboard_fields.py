"""add inline surfboard fields to surf_sessions

Revision ID: 0c1d2e3f4g56
Revises: f0c1c3f6c123
Create Date: 2026-02-07 14:30:00

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0c1d2e3f4g56"
down_revision: Union[str, Sequence[str], None] = "f0c1c3f6c123"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("surf_sessions", sa.Column("surfboard_name", sa.String(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_brand", sa.String(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_model", sa.String(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_length_ft", sa.Float(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_width_in", sa.Float(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_thickness_in", sa.Float(), nullable=True))
    op.add_column("surf_sessions", sa.Column("surfboard_volume_liters", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("surf_sessions", "surfboard_volume_liters")
    op.drop_column("surf_sessions", "surfboard_thickness_in")
    op.drop_column("surf_sessions", "surfboard_width_in")
    op.drop_column("surf_sessions", "surfboard_length_ft")
    op.drop_column("surf_sessions", "surfboard_model")
    op.drop_column("surf_sessions", "surfboard_brand")
    op.drop_column("surf_sessions", "surfboard_name")
