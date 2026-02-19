"""Merge admin branch with existing surfboard/tide branch

Revision ID: d5f1b0ae1234
Revises: c5db5e2c9ddf, 0c1d2e3f4g56
Create Date: 2026-02-07 12:30:00

"""
from typing import Sequence, Union

import sqlalchemy as sa  # noqa: F401

from alembic import op  # noqa: F401

# revision identifiers, used by Alembic.
revision: str = "d5f1b0ae1234"
down_revision: Union[str, Sequence[str], None] = ("c5db5e2c9ddf", "0c1d2e3f4g56")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op merge revision."""
    pass


def downgrade() -> None:
    """No-op merge revision."""
    pass
