"""rename surf_sessions.date to datetime (DateTime, non-nullable)

Revision ID: c1b2d3e4f5a6
Revises: 89fca42b6222
Create Date: 2026-02-01

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "c1b2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "89fca42b6222"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == "postgresql":
        op.execute("UPDATE surf_sessions SET date = CURRENT_DATE WHERE date IS NULL")
        op.execute(
            "ALTER TABLE surf_sessions ALTER COLUMN date TYPE TIMESTAMP USING (date + time '08:00:00')"
        )
        op.execute("ALTER TABLE surf_sessions RENAME COLUMN date TO datetime")
        op.execute("ALTER TABLE surf_sessions ALTER COLUMN datetime SET NOT NULL")
    else:
        op.alter_column(
            "surf_sessions",
            "date",
            new_column_name="datetime",
            type_=sa.DateTime(),
            nullable=False,
        )


def downgrade() -> None:
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == "postgresql":
        op.execute("ALTER TABLE surf_sessions ALTER COLUMN datetime DROP NOT NULL")
        op.execute(
            "ALTER TABLE surf_sessions ALTER COLUMN datetime TYPE DATE USING (datetime::date)"
        )
        op.execute("ALTER TABLE surf_sessions RENAME COLUMN datetime TO date")
    else:
        op.alter_column(
            "surf_sessions",
            "datetime",
            new_column_name="date",
            type_=sa.Date(),
            nullable=True,
        )
