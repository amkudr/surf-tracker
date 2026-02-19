"""add tides

Revision ID: aba10a3d6785
Revises: 1a32e2973cc7
Create Date: 2026-02-04 16:24:39.308435

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'aba10a3d6785'
down_revision: Union[str, Sequence[str], None] = '1a32e2973cc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("tides"):
        return

    op.create_table(
        "tides",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("height", sa.Float(), nullable=False),
        sa.Column("tide_type", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["spot_id"], ["spots.id"]),
        sa.UniqueConstraint("spot_id", "timestamp", "tide_type", name="uq_tide_spot_timestamp_type"),
    )
    op.create_index("ix_tides_spot_id", "tides", ["spot_id"], unique=False)
    op.create_index("ix_tides_timestamp", "tides", ["timestamp"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("tides"):
        return

    existing_indexes = {index["name"] for index in inspector.get_indexes("tides")}
    if "ix_tides_timestamp" in existing_indexes:
        op.drop_index("ix_tides_timestamp", table_name="tides")
    if "ix_tides_spot_id" in existing_indexes:
        op.drop_index("ix_tides_spot_id", table_name="tides")
    op.drop_table("tides")
