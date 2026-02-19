"""updated SurfForecast table

Revision ID: a425a8df3679
Revises: 780920bd1444
Create Date: 2026-02-01 13:35:39.639726

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a425a8df3679'
down_revision: Union[str, Sequence[str], None] = '780920bd1444'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "wave_direction" not in columns:
        op.add_column("surf_forecasts", sa.Column("wave_direction", sa.String(), nullable=True))
    if "energy" not in columns:
        op.add_column("surf_forecasts", sa.Column("energy", sa.Float(), nullable=True))
    if "wind_direction" not in columns:
        op.add_column("surf_forecasts", sa.Column("wind_direction", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "wind_direction" in columns:
        op.drop_column("surf_forecasts", "wind_direction")
    if "energy" in columns:
        op.drop_column("surf_forecasts", "energy")
    if "wave_direction" in columns:
        op.drop_column("surf_forecasts", "wave_direction")
