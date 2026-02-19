"""updated SurfForecast table

Revision ID: 780920bd1444
Revises: 85cd77af170c
Create Date: 2026-01-31 19:25:25.598161

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '780920bd1444'
down_revision: Union[str, Sequence[str], None] = '85cd77af170c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "is_partial" in columns:
        op.drop_column("surf_forecasts", "is_partial")


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "is_partial" not in columns:
        op.add_column(
            "surf_forecasts",
            sa.Column(
                "is_partial",
                sa.BOOLEAN(),
                autoincrement=False,
                nullable=False,
                server_default=sa.false(),
            ),
        )
