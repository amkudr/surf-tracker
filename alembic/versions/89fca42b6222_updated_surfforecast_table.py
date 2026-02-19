"""updated SurfForecast table

Revision ID: 89fca42b6222
Revises: a425a8df3679
Create Date: 2026-02-01 13:59:45.081788

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '89fca42b6222'
down_revision: Union[str, Sequence[str], None] = 'a425a8df3679'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "updated_at" not in columns:
        op.add_column("surf_forecasts", sa.Column("updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("surf_forecasts"):
        return

    columns = {column["name"] for column in inspector.get_columns("surf_forecasts")}
    if "updated_at" in columns:
        op.drop_column("surf_forecasts", "updated_at")
