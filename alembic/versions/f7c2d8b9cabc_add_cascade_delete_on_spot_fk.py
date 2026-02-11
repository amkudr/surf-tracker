"""add cascade delete on spot foreign keys

Revision ID: f7c2d8b9cabc
Revises: d5f1b0ae1234
Create Date: 2026-02-11 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7c2d8b9cabc"
down_revision: Union[str, Sequence[str], None] = "d5f1b0ae1234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ON DELETE CASCADE to all spot foreign keys."""
    op.drop_constraint("surf_sessions_spot_id_fkey", "surf_sessions", type_="foreignkey")
    op.create_foreign_key(
        None, "surf_sessions", "spots", ["spot_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_constraint("forecasts_spot_id_fkey", "forecasts", type_="foreignkey")
    op.create_foreign_key(
        None, "forecasts", "spots", ["spot_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_constraint("surf_forecasts_spot_id_fkey", "surf_forecasts", type_="foreignkey")
    op.create_foreign_key(
        None, "surf_forecasts", "spots", ["spot_id"], ["id"], ondelete="CASCADE"
    )

    op.drop_constraint("tides_spot_id_fkey", "tides", type_="foreignkey")
    op.create_foreign_key(
        None, "tides", "spots", ["spot_id"], ["id"], ondelete="CASCADE"
    )


def downgrade() -> None:
    """Revert spot foreign keys to default (no cascade)."""
    op.drop_constraint("tides_spot_id_fkey", "tides", type_="foreignkey")
    op.create_foreign_key(None, "tides", "spots", ["spot_id"], ["id"])

    op.drop_constraint("surf_forecasts_spot_id_fkey", "surf_forecasts", type_="foreignkey")
    op.create_foreign_key(None, "surf_forecasts", "spots", ["spot_id"], ["id"])

    op.drop_constraint("forecasts_spot_id_fkey", "forecasts", type_="foreignkey")
    op.create_foreign_key(None, "forecasts", "spots", ["spot_id"], ["id"])

    op.drop_constraint("surf_sessions_spot_id_fkey", "surf_sessions", type_="foreignkey")
    op.create_foreign_key(None, "surf_sessions", "spots", ["spot_id"], ["id"])
