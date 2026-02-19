"""wave_dir and wind_dir to string (compass letters) on surf_sessions

Revision ID: d1e2f3a4b5c6
Revises: c1b2d3e4f5a6
Create Date: 2026-02-01

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c1b2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("surf_sessions") as batch:
            batch.alter_column(
                "wave_dir",
                type_=sa.String(),
                existing_type=sa.Integer(),
                existing_nullable=True,
            )
            batch.alter_column(
                "wind_dir",
                type_=sa.String(),
                existing_type=sa.Integer(),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "surf_sessions",
            "wave_dir",
            type_=sa.String(),
            existing_type=sa.Integer(),
            existing_nullable=True,
        )
        op.alter_column(
            "surf_sessions",
            "wind_dir",
            type_=sa.String(),
            existing_type=sa.Integer(),
            existing_nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("surf_sessions") as batch:
            batch.alter_column(
                "wave_dir",
                type_=sa.Integer(),
                existing_type=sa.String(),
                existing_nullable=True,
            )
            batch.alter_column(
                "wind_dir",
                type_=sa.Integer(),
                existing_type=sa.String(),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "surf_sessions",
            "wave_dir",
            type_=sa.Integer(),
            existing_type=sa.String(),
            existing_nullable=True,
        )
        op.alter_column(
            "surf_sessions",
            "wind_dir",
            type_=sa.Integer(),
            existing_type=sa.String(),
            existing_nullable=True,
        )
